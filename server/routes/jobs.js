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
        schedule:schedule(id, schedule_type, schedule_details(start_time, end_time, week_day)),
        address:address(country, state, city, address_line_1, address_line_2, postal_code),
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
  const { q, schedule_type } = req.query;
  
  try {
    let query = supabase
      .from("job_offer")
      .select(`
        *,
        schedule:schedule(id, schedule_type, schedule_details(start_time, end_time, week_day)),
        address:address(country, state, city, address_line_1, address_line_2, postal_code),
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

    // Add schedule_type filter
    // (We'll filter in JavaScript after fetching)
    // if (schedule_type && schedule_type !== "all") {
    //   query = query.eq("schedule:schedule_type", schedule_type);
    // }

    const { data: jobs, error } = await query.order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Apply schedule_type filter in JavaScript (after fetching)
    let filteredJobs = jobs;
    if (schedule_type && schedule_type !== "all") {
      filteredJobs = filteredJobs.filter(job => job.schedule?.schedule_type === schedule_type);
    }

    // If we have a search term, filter the results in JavaScript with flexible matching
    if (q && q.trim()) {
      const searchTerms = q.toLowerCase().trim().split(/\s+/).filter(t => t);
      
      filteredJobs = jobs.filter(job => {
        // Create searchable text from job fields
        const searchableText = [
          job.title,
          job.description,
          job.schedule?.schedule_type,
          job.address?.city,
          job.address?.state,
          job.address?.address_line_1,
          job.employer?.user?.full_name,
          ...(job.job_offer_tasks?.map(jot => jot.task?.name) || []),
        ].join(" ").toLowerCase();

        // Check if all search terms are found (AND logic for better filtering)
        return searchTerms.every(term => searchableText.includes(term));
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
        schedule:schedule(id, schedule_type, schedule_details(start_time, end_time, week_day)),
        address:address(country, state, city, address_line_1, address_line_2, postal_code),
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