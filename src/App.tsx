import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Offer } from './components/Offer'
import { Testimonials } from './components/Testimonials'
import { Portfolio } from './components/Portfolio'
import { HowItWorks } from './components/HowItWorks'
import { WhyMe } from './components/WhyMe'
import { FAQ } from './components/FAQ'
import { FinalCTA } from './components/FinalCTA'
import { Footer } from './components/Footer'
import { StickyWhatsApp } from './components/StickyWhatsApp'

export default function App() {
  return (
    <>
      <Header />

      <main id="main">
        <Hero />
        <Offer />
        <Testimonials />
        <Portfolio />
        <HowItWorks />
        <WhyMe />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
      <StickyWhatsApp />
    </>
  )
}
