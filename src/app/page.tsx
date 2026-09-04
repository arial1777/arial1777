import { About } from "@/components/About";
import { Activities } from "@/components/Activities";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Roboto } from "@/components/Roboto";
import { Works } from "@/components/Works";

export default function Page() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Activities />
        <Works />
        <Roboto />
      </main>
      <Footer />
    </>
  );
}
