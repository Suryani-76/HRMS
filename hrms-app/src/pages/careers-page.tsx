import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, MapPin, Building, ArrowRight, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import type { JobOpening } from '@/lib/database.types'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadJobs() {
      const { data, error } = await supabase
        .from('job_openings')
        .select('*, department:departments(name)')
        .eq('status', 'Open')
        .eq('published', true)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setJobs(data as JobOpening[])
      }
      setLoading(false)
    }
    loadJobs()
  }, [])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob || !name || !email) return
    setIsSubmitting(true)
    
    // Auto-generate reference_id
    const refId = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    // Simulated ATS score for demo purposes (random 60-100)
    const atsScore = Math.floor(Math.random() * (100 - 60 + 1)) + 60

    const { error } = await supabase.from('candidates').insert({
      job_opening_id: selectedJob.id,
      name,
      email,
      phone,
      resume_url: resumeUrl,
      cover_letter: coverLetter,
      source: 'Careers Page',
      reference_id: refId,
      ats_score: atsScore
    })

    setIsSubmitting(false)
    if (error) {
      toast.error('Failed to submit application: ' + error.message)
    } else {
      toast.success(`Application submitted! Your Reference ID is ${refId}`)
      setSelectedJob(null)
      setName('')
      setEmail('')
      setPhone('')
      setResumeUrl('')
      setCoverLetter('')
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Careers at OKLUT</h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Join our team and help build the future. Browse our open positions below and apply to be part of our journey.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">Open Positions</h2>
          <Link to="/login">
            <Button variant="outline">Employee Login</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No open positions</h3>
            <p className="text-muted-foreground">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-xl border flex flex-col hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {(job as any).department?.name || 'General'}
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.employment_type || 'Full-time'}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-3 text-muted-foreground mb-4">
                    {job.description}
                  </p>
                </div>
                <Button onClick={() => setSelectedJob(job)} className="w-full gap-2">
                  Apply Now <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedJob} onOpenChange={(o) => !o && setSelectedJob(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Resume/CV URL</Label>
              <Input placeholder="Link to your portfolio or drive..." value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} />
              <p className="text-xs text-muted-foreground">Provide a link to your resume or portfolio.</p>
            </div>
            <div className="space-y-2">
              <Label>Cover Letter</Label>
              <Textarea rows={4} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedJob(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
