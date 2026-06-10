const messages = {
  contract_created: {
    es: (data) => ({ title: "Nuevo contrato recibido 📄", message: `Tienes un contrato pendiente de firma para "${data.title}".` }),
    en: (data) => ({ title: "New contract received 📄", message: `You have a contract pending signature for "${data.title}".` }),
    fr: (data) => ({ title: "Nouveau contrat reçu 📄", message: `Vous avez un contrat en attente de signature pour "${data.title}".` }),
  },
  contract_signed: {
    es: (data) => ({ title: "Contrato firmado ✍️", message: `Tu trabajadora firmó el contrato "${data.title}". Revisalo para activarlo.` }),
    en: (data) => ({ title: "Contract signed ✍️", message: `Your worker signed the contract "${data.title}". Review it to activate it.` }),
    fr: (data) => ({ title: "Contrat signé ✍️", message: `Votre employée a signé le contrat "${data.title}". Vérifiez-le pour l'activer.` }),
  },
  contract_accepted: {
    es: () => ({ title: "Contrato activado 🤝", message: "Tu empleadora revisó y activó el contrato. ¡Ya está vigente!" }),
    en: () => ({ title: "Contract activated 🤝", message: "Your employer reviewed and activated the contract. It's now active!" }),
    fr: () => ({ title: "Contrat activé 🤝", message: "Votre employeuse a vérifié et activé le contrat. Il est maintenant en vigueur !" }),
  },
  contract_rejected: {
    es: (data) => ({ title: "Contrato rechazado 🚫", message: `Tu trabajadora rechazó el contrato "${data.title}".` }),
    en: (data) => ({ title: "Contract rejected 🚫", message: `Your worker rejected the contract "${data.title}".` }),
    fr: (data) => ({ title: "Contrat refusé 🚫", message: `Votre employée a refusé le contrat "${data.title}".` }),
  },
  contract_finished_employer: {
    es: (data) => ({ title: "Contrato finalizado 🏁", message: `Tu empleadora finalizó el contrato "${data.title}": ${data.reason}` }),
    en: (data) => ({ title: "Contract ended 🏁", message: `Your employer ended the contract "${data.title}": ${data.reason}` }),
    fr: (data) => ({ title: "Contrat terminé 🏁", message: `Votre employeuse a mis fin au contrat "${data.title}" : ${data.reason}` }),
  },
  contract_finished_employee: {
    es: (data) => ({ title: "Contrato finalizado 🏁", message: `Tu trabajadora renunció al contrato "${data.title}": ${data.reason}` }),
    en: (data) => ({ title: "Contract ended 🏁", message: `Your worker resigned from the contract "${data.title}": ${data.reason}` }),
    fr: (data) => ({ title: "Contrat terminé 🏁", message: `Votre employée a démissionné du contrat "${data.title}" : ${data.reason}` }),
  },

  application_received: {
    es: (data) => ({ title: "Nueva postulación recibida 💼", message: `Alguien se postuló a tu oferta "${data.title}".` }),
    en: (data) => ({ title: "New application received 💼", message: `Someone applied to your offer "${data.title}".` }),
    fr: (data) => ({ title: "Nouvelle candidature reçue 💼", message: `Quelqu'un a postulé à votre offre "${data.title}".` }),
  },
  application_accepted: {
    es: (data) => ({ title: "Postulación aceptada ✨", message: `Tu postulación a "${data.title}" fue aceptada. Pronto recibirás el contrato.` }),
    en: (data) => ({ title: "Application accepted ✨", message: `Your application to "${data.title}" was accepted. You'll receive the contract soon.` }),
    fr: (data) => ({ title: "Candidature acceptée ✨", message: `Votre candidature à "${data.title}" a été acceptée. Vous recevrez bientôt le contrat.` }),
  },
  application_rejected: {
    es: (data) => ({ title: "Postulación no seleccionada", message: `Tu postulación a "${data.title}" no fue seleccionada esta vez.` }),
    en: (data) => ({ title: "Application not selected", message: `Your application to "${data.title}" was not selected this time.` }),
    fr: (data) => ({ title: "Candidature non retenue", message: `Votre candidature à "${data.title}" n'a pas été retenue cette fois.` }),
  },

  invitation_received: {
    es: (data) => ({ title: "Nueva invitación recibida 📨", message: `Un empleador te invitó a aplicar a la oferta "${data.title}".` }),
    en: (data) => ({ title: "New invitation received 📨", message: `An employer invited you to apply for "${data.title}".` }),
    fr: (data) => ({ title: "Nouvelle invitation reçue 📨", message: `Un employeur vous a invité à postuler à "${data.title}".` }),
  },
  invitation_accepted: {
    es: (data) => ({ title: "Invitación aceptada 🎉", message: `Una trabajadora aceptó tu invitación a "${data.title}".` }),
    en: (data) => ({ title: "Invitation accepted 🎉", message: `A worker accepted your invitation to "${data.title}".` }),
    fr: (data) => ({ title: "Invitation acceptée 🎉", message: `Une employée a accepté votre invitation à "${data.title}".` }),
  },
  invitation_rejected: {
    es: (data) => ({ title: "Invitación rechazada", message: `Una trabajadora rechazó tu invitación a "${data.title}".` }),
    en: (data) => ({ title: "Invitation rejected", message: `A worker rejected your invitation to "${data.title}".` }),
    fr: (data) => ({ title: "Invitation refusée", message: `Une employée a refusé votre invitation à "${data.title}".` }),
  },

  payment_received: {
    es: (data) => ({ title: "Comprobante de pago recibido 💰", message: `Tu empleadora subió el comprobante de pago del mes ${data.month}.` }),
    en: (data) => ({ title: "Payment receipt received 💰", message: `Your employer uploaded the payment receipt for ${data.month}.` }),
    fr: (data) => ({ title: "Reçu de paiement reçu 💰", message: `Votre employeuse a téléchargé le reçu de paiement pour ${data.month}.` }),
  },

  task_assigned: {
    es: (data) => ({ title: "Nueva tarea asignada 📋", message: `Tu empleadora te asignó una tarea: ${data.name}` }),
    en: (data) => ({ title: "New task assigned 📋", message: `Your employer assigned you a task: ${data.name}` }),
    fr: (data) => ({ title: "Nouvelle tâche assignée 📋", message: `Votre employeuse vous a assigné une tâche : ${data.name}` }),
  },
  task_deleted: {
    es: (data) => ({ title: "Tarea cancelada 🗑️", message: `Tu empleadora canceló la tarea: ${data.name}` }),
    en: (data) => ({ title: "Task cancelled 🗑️", message: `Your employer cancelled the task: ${data.name}` }),
    fr: (data) => ({ title: "Tâche annulée 🗑️", message: `Votre employeuse a annulé la tâche : ${data.name}` }),
  },

  attendance_approve: {
    es: (data) => ({ title: "Asistencia aprobada ✅", message: `Tu empleadora aprobó tu asistencia del ${data.date}` }),
    en: (data) => ({ title: "Attendance approved ✅", message: `Your employer approved your attendance for ${data.date}` }),
    fr: (data) => ({ title: "Présence approuvée ✅", message: `Votre employeuse a approuvé votre présence du ${data.date}` }),
  },
  attendance_reject: {
    es: (data) => ({ title: "Asistencia rechazada ❌", message: `Tu empleadora rechazó tu asistencia del ${data.date}: "${data.reason}"` }),
    en: (data) => ({ title: "Attendance rejected ❌", message: `Your employer rejected your attendance for ${data.date}: "${data.reason}"` }),
    fr: (data) => ({ title: "Présence refusée ❌", message: `Votre employeuse a refusé votre présence du ${data.date} : "${data.reason}"` }),
  },
  attendance_justify: {
    es: (data) => ({ title: "Nueva justificación recibida", message: `Tu trabajadora justificó su asistencia del ${data.date}` }),
    en: (data) => ({ title: "New justification received", message: `Your worker justified their attendance for ${data.date}` }),
    fr: (data) => ({ title: "Nouvelle justification reçue", message: `Votre employée a justifié sa présence du ${data.date}` }),
  },
  attendance_observe: {
    es: (data) => ({ title: "Nueva observación 💬", message: `Tu empleadora dejó una observación en tu asistencia del ${data.date}` }),
    en: (data) => ({ title: "New observation 💬", message: `Your employer left an observation on your attendance for ${data.date}` }),
    fr: (data) => ({ title: "Nouvelle observation 💬", message: `Votre employeuse a laissé une observation sur votre présence du ${data.date}` }),
  },
};

const getUserLanguage = async (supabase, userId) => {
  const { data } = await supabase
    .from("app_user")
    .select("language")
    .eq("id", userId)
    .single();
  return data?.language || "es";
};

const getNotifyContent = async (supabase, type, userId, data = {}) => {
  const lang = await getUserLanguage(supabase, userId);
  const supported = ["es", "en", "fr"];
  const safeLang = supported.includes(lang) ? lang : "es";
  const builder = messages[type]?.[safeLang];
  if (!builder) return { title: type, message: "" };
  return builder(data);
};

module.exports = { getNotifyContent };