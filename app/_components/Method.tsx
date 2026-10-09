import { Camera, Search, ShoppingBag } from "lucide-react";
import SectionHead from "./SectionHead";
const steps = [
  { icon: Camera, title: "Start with a photo", body: "A meal on your camera roll, a screenshot, or the plate in front of you. Pick a clear photo of the dish you want." },
  { icon: Search, title: "Explore your matches", body: "We identify the food and look for matching dishes. Compare restaurants, prices, and delivery estimates." },
  { icon: ShoppingBag, title: "You choose what’s next", body: "Add your favourite to the cart. Connect Swiggy when you’re ready to order, then follow your delivery." },
];
export default function Method() {
  return <section id="method" className="relative px-5 py-16 lg:px-10"><div className="mx-auto max-w-[1400px]">
    <SectionHead index="04" eyebrow="How it works" title={<>Good food. <span className="display-em">Less guesswork.</span></>} lede="From a food photo to your next meal, in three simple steps." />
    <ol className="method-grid">{steps.map(({icon: Icon, title, body}, i) => <li key={title}><div className="method-step"><Icon size={23} /><span>0{i + 1}</span></div><h3>{title}</h3><p>{body}</p></li>)}</ol>
  </div></section>;
}
