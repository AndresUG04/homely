const supabase = require("../config/supabase");

const notify = async ({ userId, type, referenceId, data = {} }) => {
  const { getNotifyContent } = require("./notifyMessages");
  const { title, message } = await getNotifyContent(supabase, type, userId, data);

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    reference_id: referenceId || null,
    data,
  });

  if (error) console.error("[notify] Error:", error.message);
};

module.exports = notify;