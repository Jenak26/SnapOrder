"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Camera, Check, ScanLine, Sparkles } from "lucide-react";

const cravings = [
  { name: "Classic smash burger", short: "Something juicy", image: "/hero-burger.png" },
  { name: "Wood-fired margherita", short: "Something cheesy", image: "/food-pizza.png" },
  { name: "Fresh salmon poke bowl", short: "Something fresh", image: "/food-pokebowl.png" },
];

export default function Hero() {
  const [activeCraving, setActiveCraving] = useState(0);
  const craving = cravings[activeCraving];

  return (
    <section id="hero" className="home-hero">
      <div className="hero-copy">
        <p className="hero-eyebrow"><Sparkles size={15} /> FOR THE LOVE OF THE FIRST BITE</p>
        <h1>Big cravings.<br /><span>Great finds.</span><svg className="craving-underline" viewBox="0 0 400 20" fill="none" aria-hidden="true"><path d="M4 12C94 1 268 2 393 8M65 18C174 9 278 11 344 16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg></h1>
        <p className="hero-description">That dish you can’t stop thinking about? Share a photo. We’ll help you find it at restaurants near you.</p>
        <div className="hero-actions">
          <a href="#upload" id="hero-cta" className="hero-primary"><Camera size={19} /> Upload a food photo <ArrowRight size={18} /></a>
          <a href="#method" id="hero-demo" className="hero-secondary">How it works <ArrowRight size={16} /></a>
        </div>
        <div className="hero-note"><Check size={16} /> Any food photo <span>•</span> You choose what to order</div>
        <p className="hero-side-note" aria-hidden="true">Less scrolling. More savouring.</p>
      </div>
      <div className="hero-visual">
        <div className="hero-photo-frame">
          <Image key={craving.image} src={craving.image} alt={craving.name} width={640} height={640} preload={activeCraving === 0} sizes="(max-width: 767px) 90vw, 45vw" className="hero-food" />
          <div className="hero-photo-label"><ScanLine size={17} /> See something delicious?</div>
        </div>
        <div className="craving-seal" aria-hidden="true"><Sparkles size={22} /><span>LOVE AT<br />FIRST BITE</span></div>
        <div className="hero-result">
          <div className="hero-result-icon"><Check size={21} /></div>
          <div aria-live="polite"><span className="hero-result-label">A LITTLE TASTE OF WHAT’S POSSIBLE</span><h2>{craving.name}</h2><p>Example photo match</p></div>
          <a href="#demo" aria-label="See an example food match"><ArrowRight size={21} /></a>
        </div>
        <div className="craving-picker" aria-label="Preview a food craving">
          {cravings.map((item, index) => <button key={item.name} type="button" onClick={() => setActiveCraving(index)} aria-pressed={activeCraving === index} aria-label={`Preview ${item.name}`} className={activeCraving === index ? "selected" : ""}><Image src={item.image} alt="" width={52} height={52} /><span>{item.short}</span></button>)}
        </div>
      </div>
      <ol className="hero-steps">
        <li><span>01</span><div><strong>Show us your craving</strong><p>Upload or take a food photo</p></div></li>
        <li><span>02</span><div><strong>Find your favourite</strong><p>Compare matching dishes nearby</p></div></li>
        <li><span>03</span><div><strong>Make it a meal</strong><p>Choose your dish and order</p></div></li>
      </ol>
    </section>
  );
}
