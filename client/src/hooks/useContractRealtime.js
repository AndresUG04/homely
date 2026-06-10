import { useEffect, useRef } from "react";
import { supabase } from "../config/supabase";

export function useContractRealtime(userId, { onUpdate, onInsert } = {}) {
  const onUpdateRef = useRef(onUpdate);
  const onInsertRef = useRef(onInsert);
  onUpdateRef.current = onUpdate;
  onInsertRef.current = onInsert;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("contract-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
          filter: `employer_user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") onUpdateRef.current?.(payload.new, payload.old);
          if (payload.eventType === "INSERT") onInsertRef.current?.(payload.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
          filter: `employee_user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") onUpdateRef.current?.(payload.new, payload.old);
          if (payload.eventType === "INSERT") onInsertRef.current?.(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Conectado a contracts");
        }
        if (status === "CHANNEL_ERROR") {
          console.warn("[Realtime] Error en canal contracts");
        }
        if (status === "TIMED_OUT") {
          console.warn("[Realtime] Timeout en contracts");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}

export function useCurrentContractRealtime(contractId, onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!contractId) return;

    const channel = supabase
      .channel(`contract-${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
          filter: `id=eq.${contractId}`,
        },
        (payload) => {
          onUpdateRef.current?.(payload.new, payload.old);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Conectado a contract-${contractId}`);
        }
        if (status === "CHANNEL_ERROR") {
          console.warn(`[Realtime] Error en contract-${contractId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractId]);
}
