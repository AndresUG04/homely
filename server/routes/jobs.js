const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

// GET all contracts
router.get("/", auth, async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    console.log("userId:", userId);
    console.log("role:", role);

    const field = role === "employer" ? "employer_user_id" : "employee_user_id";
    const { data, error } = await supabase
        .from("contract")
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
          task:task(id, name, description)
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
          task:task(id, name, description)
        )
      `)
      .eq("status", "open");

    const { data: jobs, error } = await query.order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    let filteredJobs = jobs;
    if (schedule_type && schedule_type !== "all") {
      filteredJobs = filteredJobs.filter(job => job.schedule?.schedule_type === schedule_type);
    }

    if (q && q.trim()) {
      const searchTerms = q.toLowerCase().trim().split(/\s+/).filter(t => t);
      filteredJobs = filteredJobs.filter(job => {
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
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    return res.json({ jobs: filteredJobs });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/jobs/mine - Get employer's own job offers (MUST be before /:id)
router.get("/mine", auth, async (req, res) => {
  console.log("REQ.USER:", req.user);
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden ver sus ofertas" });
    }

    const { data: jobs, error } = await supabase
      .from("job_offer")
      .select(`
        *,
        schedule:schedule(id, schedule_type, schedule_details(start_time, end_time, week_day)),
        address:address(country, state, city, address_line_1, address_line_2, postal_code),
        job_offer_tasks:job_offer_task(
          task:task(id, name, description)
        )
      `)
      .eq("employer_user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ jobs });
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
          task:task(id, name, description)
        )
      `)
      .eq("id", id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!job) return res.status(404).json({ error: "Job offer not found or not available" });
    
    return res.json({ job });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/jobs/:id - Update job offer
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden editar ofertas" });
    }

    const { id } = req.params;
    const { title, description, salary, schedule, address, tasks, expiration_date } = req.body;

    const { data: existingJob, error: fetchError } = await supabase
      .from("job_offer")
      .select("employer_user_id, schedule_id, address")
      .eq("id", id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({ error: "Job offer not found" });
    }

    if (existingJob.employer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to edit this job offer" });
    }

    if (schedule) {
      const { error: schedError } = await supabase
        .from("schedule")
        .update({ schedule_type: schedule.schedule_type })
        .eq("id", existingJob.schedule_id);

      if (schedError) return res.status(500).json({ error: schedError.message });

      await supabase.from("schedule_details").delete().eq("schedule_id", existingJob.schedule_id);

      if (schedule.details && schedule.details.length) {
        const detailsToInsert = schedule.details.map(d => ({
          schedule_id: existingJob.schedule_id,
          start_time: d.start_time,
          end_time: d.end_time,
          week_day: d.week_day
        }));

        const { error: detailsError } = await supabase
          .from("schedule_details")
          .insert(detailsToInsert);

        if (detailsError) return res.status(500).json({ error: detailsError.message });
      }
    }

    if (address && Object.values(address).some(v => v)) {
      if (existingJob.address) {
        const { error: addrError } = await supabase
          .from("address")
          .update(address)
          .eq("id", existingJob.address);

        if (addrError) return res.status(500).json({ error: addrError.message });
      } else {
        const { data: newAddress, error: addrError } = await supabase
          .from("address")
          .insert(address)
          .select()
          .single();

        if (addrError) return res.status(500).json({ error: addrError.message });

        await supabase.from("job_offer").update({ address: newAddress.id }).eq("id", id);
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (salary !== undefined) updateData.salary = salary;
    if (expiration_date !== undefined) updateData.expiration_date = expiration_date;

    if (Object.keys(updateData).length > 0) {
      const { error: jobError } = await supabase
        .from("job_offer")
        .update(updateData)
        .eq("id", id);

      if (jobError) return res.status(500).json({ error: jobError.message });
    }

    if (tasks !== undefined) {
      await supabase.from("job_offer_task").delete().eq("job_offer_id", id);

      if (tasks.length) {
        for (const t of tasks) {
          let taskId;

          const { data: existing } = await supabase
            .from("task")
            .select("*")
            .eq("name", t.name)
            .maybeSingle();

          if (existing) {
            taskId = existing.id;
          } else {
            const { data: newTask, error: taskError } = await supabase
              .from("task")
              .insert({
                name: t.name,
                description: t.description,
                task_type: t.task_type || "default"
              })
              .select()
              .single();

            if (taskError) return res.status(500).json({ error: taskError.message });
            taskId = newTask.id;
          }

          await supabase.from("job_offer_task").insert({
            job_offer_id: id,
            task_id: taskId
          });
        }
      }
    }

    return res.json({ message: "Job offer updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// // GET /api/jobs/mine - jobs del employer loggeado
// router.get("/mine", auth, async (req, res) => {
//   try {
//     if (req.user.role !== "employer") {
//       return res.status(403).json({ error: "Solo empleadores" });
//     }

//     const { data: jobs, error } = await supabase
//       .from("job_offer")
//       .select(`
//         *,
//         schedule:schedule(id, schedule_type, schedule_details(start_time, end_time, week_day)),
//         address:address(country, state, city, address_line_1, address_line_2, postal_code),
//         job_offer_tasks:job_offer_task(
//           task:task(id, name, description)
//         )
//       `)
//       .eq("employer_user_id", req.user.id)
//       .order("created_at", { ascending: false });

//     if (error) return res.status(500).json({ error: error.message });

//     return res.json({ jobs });

//   } catch (err) {
//     return res.status(500).json({ error: "Server error" });
//   }
// });

// POST /api/jobs - Create new job offer
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden crear ofertas" });
    }

    const { title, description, salary, schedule, address, tasks, expiration_date } = req.body;

    if (!title || !schedule) {
      return res.status(400).json({ error: "title y schedule son requeridos" });
    }

    const { data: newSchedule, error: scheduleError } = await supabase
      .from("schedule")
      .insert({ schedule_type: schedule.schedule_type })
      .select()
      .single();

    if (scheduleError) return res.status(500).json({ error: scheduleError.message });

    if (schedule.details && schedule.details.length) {
      const detailsToInsert = schedule.details.map(d => ({
        schedule_id: newSchedule.id,
        start_time: d.start_time,
        end_time: d.end_time,
        week_day: d.week_day
      }));

      const { error: detailsError } = await supabase
        .from("schedule_details")
        .insert(detailsToInsert);

      if (detailsError) return res.status(500).json({ error: detailsError.message });
    }

    let address_id = null;

    if (address && Object.values(address).some(v => v)) {
      const { data: newAddress, error: addrError } = await supabase
        .from("address")
        .insert(address)
        .select()
        .single();

      if (addrError) return res.status(500).json({ error: addrError.message });
      address_id = newAddress.id;
    }

    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .insert({
        title, description, salary,
        schedule_id: newSchedule.id,
        employer_user_id: req.user.id,
        address: address_id,
        expiration_date,
        status: "open"
      })
      .select()
      .single();

    if (jobError) return res.status(500).json({ error: jobError.message });

    if (tasks && tasks.length) {
      for (const t of tasks) {
        let taskId;

        const { data: existing } = await supabase
          .from("task")
          .select("*")
          .eq("name", t.name)
          .maybeSingle();

        if (existing) {
          taskId = existing.id;
        } else {
          const { data: newTask, error: taskError } = await supabase
            .from("task")
            .insert({
              name: t.name,
              description: t.description,
              task_type: t.task_type || "default"
            })
            .select()
            .single();

          if (taskError) return res.status(500).json({ error: taskError.message });
          taskId = newTask.id;
        }

        await supabase.from("job_offer_task").insert({
          job_offer_id: job.id,
          task_id: taskId
        });
      }
    }

    return res.json({ message: "Job offer creada correctamente", job });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/jobs/:id - Delete job offer
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden eliminar ofertas" });
    }

    const { id } = req.params;

    const { data: existingJob, error: fetchError } = await supabase
      .from("job_offer")
      .select("employer_user_id, schedule_id, address")
      .eq("id", id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({ error: "Job offer not found" });
    }

    if (existingJob.employer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this job offer" });
    }

    await supabase.from("job_offer_task").delete().eq("job_offer_id", id);
    await supabase.from("job_offer_application").delete().eq("job_offer_id", id);
    await supabase.from("schedule_details").delete().eq("schedule_id", existingJob.schedule_id);
    await supabase.from("schedule").delete().eq("id", existingJob.schedule_id);

    const { error } = await supabase.from("job_offer").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ message: "Job offer deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/tasks - Get all available tasks
router.get("/tasks", auth, async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from("task")
      .select("*")
      .order("name", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
