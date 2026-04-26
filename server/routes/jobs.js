const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

// GET /api/jobs - Get all open job offers (for browsing)
router.get("/", auth, async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from("job_offer")
      .select(`
        *,
        schedule:schedule(name),
        employer:employer_user(
          user:app_user(
            full_name, 
            email,
            address:address(country, state, city, address_line_1)
          )
        ),
        job_offer_tasks:job_offer_task(
          task:task(name, description)
        )
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    return res.json({ jobs });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/jobs/search - Search job offers
router.get("/search", auth, async (req, res) => {
  const { q } = req.query;
  
  try {
    let query = supabase
      .from("job_offer")
      .select(`
        *,
        schedule:schedule(name),
        employer:employer_user(
          user:app_user(
            full_name, 
            email,
            address:address(country, state, city, address_line_1)
          )
        ),
        job_offer_tasks:job_offer_task(
          task:task(name, description)
        )
      `)
      .eq("status", "open");

    // Add search filter - search across title, description, address, schedule, and tasks
    if (q && q.trim()) {
      const searchTerm = q.trim();
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      
      // We'll fetch all open jobs and filter in JavaScript
    }

    const { data: jobs, error } = await query.order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // If we have a search term, filter the results in JavaScript for complex searches
    let filteredJobs = jobs;
    if (q && q.trim()) {
      const searchTerm = q.toLowerCase().trim();
      filteredJobs = jobs.filter(job => {
        // Search in title and description
        if (job.title?.toLowerCase().includes(searchTerm) || 
            job.description?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in address
        const address = job.employer?.user?.address;
        if (address) {
          const addressString = `${address.country} ${address.state} ${address.city} ${address.address_line_1}`.toLowerCase();
          if (addressString.includes(searchTerm)) return true;
        }
        
        // Search in schedule name
        if (job.schedule?.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search in task names
        if (job.job_offer_tasks) {
          return job.job_offer_tasks.some(jot => 
            jot.task?.name?.toLowerCase().includes(searchTerm) ||
            jot.task?.description?.toLowerCase().includes(searchTerm)
          );
        }
        
        return false;
      });
    }
    
    return res.json({ jobs: filteredJobs });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/jobs/:id - Get specific job offer
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: job, error } = await supabase
      .from("job_offer")
      .select(`
        *,
        schedule:schedule(name),
        employer:employer_user(
          user:app_user(
            full_name, 
            email,
            address:address(country, state, city, address_line_1)
          )
        ),
        job_offer_tasks:job_offer_task(
          task:task(name, description)
        )
      `)
      .eq("id", id)
      .eq("status", "open")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!job) return res.status(404).json({ error: "Job offer not found or not available" });
    
    return res.json({ job });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;