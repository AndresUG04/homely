import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CheckCircle,
  TrendingUp,
  Award,
  Heart,
  Clock,
} from "lucide-react";

function vacationCalculation (startDate, diasTotalesAnio = 15) {
  if (!startDate) return null;
  const inicio = new Date(startDate);
  const hoy = new Date();
  const mesesTrabajados =
    (hoy.getFullYear() - inicio.getFullYear()) * 12 +
    (hoy.getMonth() - inicio.getMonth());
  const dias = (diasTotalesAnio / 12) * Math.max(0, mesesTrabajados);
  return Math.floor(dias);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSalary(amount) {
  if (!amount && amount !== 0) return "—";
  return `₡${Number(amount).toLocaleString("es-CR")}`;
}

const estadoColor = {
  accepted: "text-green-600",
  expired:  "text-red-500",
  pending:  "text-amber-600",
  rejected: "text-gray-500",
};

const estadoLabel = {
  accepted: "Activo",
  expired:  "Vencido",
  pending:  "Pendiente",
  rejected: "Rechazado",
};

export default function Benefits({ contract, onBack }) {
  if (!contract) return null;

  const jobTitle     = contract.job_offer?.title ?? "Contrato";
  const employerName = contract.employer_user?.full_name ?? "—";
  const salary       = formatSalary(contract.salary ?? contract.job_offer?.salary);
  const startDate    = formatDate(contract.start_date);
  const endDate      = formatDate(contract.end_date);
  const status       = contract.status ?? "pending";
  const statusLabel  = estadoLabel[status] ?? status;
  const statusColor  = estadoColor[status] ?? "text-gray-500";
  const payments     = contract.payments ?? [];
  const vacationDays = vacationCalculation(contract.start_date);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a contratos
        </button>

        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Dashboard financiero
        </h1>

        <p className="text-sm text-[#5C3A1E]/60">
          {jobTitle} · {employerName}
        </p>
      </div>

      {/* RESUMEN FINANCIERO */}
      <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
          Resumen financiero
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Salario mensual",  value: salary,   Icon: DollarSign },
            { label: "Ingresos del año", value: formatSalary((contract.salary ?? contract.job_offer?.salary ?? 0) * 12), Icon: TrendingUp },
            { label: "Inicio contrato",  value: startDate, Icon: Calendar },
            { label: "Estado",           value: statusLabel, Icon: Award, colored: true, colorClass: statusColor },
          ].map(({ label, value, Icon, colored, colorClass }) => (
            <div key={label} className="rounded-xl bg-[#FBF5E0] p-4">
              <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">{label}</p>
              <div className={`flex items-center gap-2 text-sm font-semibold ${colored ? colorClass : "text-[#2C1A0E]"}`}>
                <Icon className="w-4 h-4 text-[#D06224]" />
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HISTORIAL DE PAGOS */}
      <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
          Historial de pagos
        </p>
        <div className="mt-4 space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-[#5C3A1E]/60 py-4 text-center">Sin historial de pagos.</p>
          ) : (
            payments.map((payment, i) => {
              const label  = payment.period_label ?? formatDate(payment.paid_at ?? payment.created_at);
              const amount = formatSalary(payment.amount);
              const isPaid = payment.status === "paid" || !!payment.paid_at;

              return (
                <div
                  key={payment.id ?? i}
                  className="flex items-center justify-between bg-[#FBF5E0] rounded-xl px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E7D5B8] flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#D06224]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C1A0E]">{label}</p>
                      <p className="text-xs text-[#5C3A1E]/60">Salario mensual</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#2C1A0E]">{amount}</span>
                    {isPaid && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Pagado
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
          Beneficios
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { Icon: Heart,    title: "Seguro médico",      desc: "Cobertura médica activa."      },
            {
              Icon: Calendar,
              title: "Vacaciones pagadas",
              desc: vacationDays !== null
                ? `${vacationDays} días acumulados`
                : "Sin fecha de inicio registrada.",
            },
            { Icon: Award,    title: "Bono de desempeño",  desc: "Elegible para bonificaciones." },
            { Icon: Clock,    title: "Horario estable",    desc: "40 horas semanales."           },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-[#FBF5E0] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#D06224]" />
                <h3 className="font-semibold text-[#2C1A0E]">{title}</h3>
              </div>
              <p className="text-sm text-[#5C3A1E]/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INFORMACIÓN DEL CONTRATO */}
      <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
          Información del contrato
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Puesto",       value: jobTitle,    colored: false },
            { label: "Inicio",       value: startDate,   colored: false },
            { label: "Finalización", value: endDate,     colored: false },
            { label: "Estado",       value: statusLabel, colored: true, colorClass: statusColor },
          ].map(({ label, value, colored, colorClass }) => (
            <div key={label} className="rounded-xl bg-[#FBF5E0] p-4">
              <p className="text-xs text-[#5C3A1E]/60 mb-1">{label}</p>
              <p className={`font-semibold ${colored ? colorClass : "text-[#2C1A0E]"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}