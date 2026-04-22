import { useEffect, useState } from "react";
import Hero from "./sections/Hero";
import InputSection from "./sections/Input";
import OutputSection from "./sections/Output";

export default function App() {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (!formData?.birth) return;
    requestAnimationFrame(() => {
      document.getElementById("output")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [formData?.birth]);

  return (
    <>
      <Hero />
      <InputSection onSubmit={setFormData} />
      <OutputSection formData={formData} />
    </>
  );
}