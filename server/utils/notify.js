const supabase = require("../config/supabase");

const notify = async ({ userId, title, message, type, referenceId }) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    reference_id: referenceId || null,
  });
  if (error) console.error("[notify] Error:", error.message);
};

module.exports = notify;