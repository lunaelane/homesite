import ModalProvider from '@/components/ModalProvider';
import RevealInit from '@/components/RevealInit';
import Nav from '@/components/Nav';
import SystemScroll from '@/components/SystemScroll';

import Hero from '@/components/sections/Hero';
import Problem from '@/components/sections/Problem';
import WhyLunaeLane from '@/components/sections/WhyLunaeLane';
import WhatIsSoha from '@/components/sections/WhatIsSoha';
import Roles from '@/components/sections/Roles';
import About from '@/components/sections/About';
import Team from '@/components/sections/Team';
import Cta from '@/components/sections/Cta';
import Footer from '@/components/sections/Footer';

export default function Page() {
  return (
    <ModalProvider>
      <RevealInit />
      <Nav />
      <Hero />
      <Problem />
      <WhyLunaeLane />
      <WhatIsSoha />
      <Roles />
      <SystemScroll />
      <About />
      <Team />
      <Cta />
      <Footer />
    </ModalProvider>
  );
}
