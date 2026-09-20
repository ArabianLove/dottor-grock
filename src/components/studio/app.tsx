import { useEffect, useState } from "react";
import { Welcome } from "./welcome";
import { ConsultRoom } from "./consult";
import { useStudio } from "@/lib/grock/store";

export function StudioApp() {
  const [hydrated, setHydrated] = useState(false);
  const accepted = useStudio((s) => s.acceptedEthics);
  const activeId = useStudio((s) => s.activeId);
  const consult = useStudio((s) => s.consults.find((c) => c.id === s.activeId));

  useEffect(() => {
    const unsub = useStudio.persist.onFinishHydration(() => setHydrated(true));
    if (useStudio.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated || !accepted || !activeId || !consult) {
    return <Welcome />;
  }
  return <ConsultRoom consult={consult} />;
}
