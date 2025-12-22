"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  PiggyBank, 
  ArrowRight, 
  Wallet, 
  BarChart3, 
  Shield, 
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Download,
  FileText,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    icon: Wallet,
    title: "Connect Your Accounts",
    description: "Link your bank and credit cards in seconds. See all your money in one place.",
  },
  {
    icon: Sparkles,
    title: "Give Every Dollar a Job",
    description: "Assign your money to categories before you spend it. No more guessing.",
  },
  {
    icon: BarChart3,
    title: "See Where Money Goes",
    description: "Simple charts show your income vs. spending. Know exactly what's happening.",
  },
  {
    icon: Download,
    title: "Download Reports Anytime",
    description: "Export your Income & Spending summary as PDF or Excel. Perfect for taxes.",
  },
];

const benefits = [
  "Stop living paycheck to paycheck",
  "Pay off debt faster",
  "Save for what matters",
  "Feel confident about money",
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      { text: "Connect 2 bank accounts", included: true },
      { text: "Track spending by category", included: true },
      { text: "Basic reports", included: true },
      { text: "1 savings goal", included: true },
      { text: "PDF & Excel exports", included: false },
      { text: "Unlimited accounts", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$9",
    period: "/month",
    description: "Everything you need to master your money",
    features: [
      { text: "Unlimited bank accounts", included: true },
      { text: "Track spending by category", included: true },
      { text: "Advanced reports & insights", included: true },
      { text: "Unlimited savings goals", included: true },
      { text: "PDF & Excel exports", included: true },
      { text: "Bill reminders", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    highlighted: true,
  },
];

const faqs = [
  {
    question: "Is my data secure?",
    answer: "Absolutely! We use bank-level 256-bit encryption to protect your data. We never store your bank login credentials — we use secure read-only connections through trusted partners like Plaid.",
  },
  {
    question: "Do I need to know accounting?",
    answer: "Not at all! Budget Buddy is designed for everyday people, not accountants. We use plain language like 'Money In' and 'Money Out' instead of confusing finance jargon. If you can add and subtract, you can use Budget Buddy.",
  },
  {
    question: "Can I export my reports?",
    answer: "Yes! Premium users can download their Income & Spending summaries as PDF or Excel files anytime. These are perfect for tax preparation, sharing with a partner, or keeping personal records.",
  },
  {
    question: "How is this different from my bank app?",
    answer: "Your bank shows what you spent. Budget Buddy helps you plan where your money should go before you spend it. It's the difference between looking in the rearview mirror and looking at the road ahead.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, absolutely! You can cancel your Premium subscription anytime with just one click. No long-term contracts, no cancellation fees. We believe you should stay because you love the product, not because you're locked in.",
  },
  {
    question: "How long does it take to set up?",
    answer: "Most people are up and running in under 5 minutes. Connect your bank accounts, set a few budget categories, and you're ready to go. We'll even suggest categories based on your spending history.",
  },
  {
    question: "Can I share my budget with my partner?",
    answer: "Yes! Premium users can invite a partner to view and collaborate on their budget. Both of you will see the same accounts, categories, and goals — perfect for couples managing money together.",
  },
  {
    question: "What if I have multiple bank accounts?",
    answer: "No problem! Budget Buddy can connect to multiple banks and credit cards. All your accounts show up in one place, giving you a complete picture of your finances without logging into multiple apps.",
  },
  {
    question: "Is there a mobile app?",
    answer: "Budget Buddy works beautifully on any device through your web browser. Whether you're on your phone, tablet, or computer, you'll have full access to your budget. A dedicated mobile app is coming soon!",
  },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <PiggyBank className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Budget Buddy</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Simple budgeting for real life
            </div>
            
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Finally see where
              <br />
              <span className="text-primary">your money goes</span>
            </h1>
            
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Budget Buddy helps you give every dollar a job, so you can stop stressing 
              and start saving. It's budgeting made so simple, anyone can do it.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button variant="hero" className="group">
                  Start Your Budget
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="hero-outline">
                  I Have an Account
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 md:mt-24"
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
                <div className="border-b border-border bg-secondary/30 px-4 py-3">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-warning/60" />
                    <div className="h-3 w-3 rounded-full bg-success/60" />
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  {/* Dashboard Preview */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Safe to Spend</p>
                        <p className="text-3xl font-bold text-success">$1,247.50</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="rounded-lg bg-success/10 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Money In</p>
                          <p className="text-sm font-semibold text-success">$3,300</p>
                        </div>
                        <div className="rounded-lg bg-destructive/10 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Money Out</p>
                          <p className="text-sm font-semibold text-destructive">$2,052</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-4 overflow-hidden rounded-full bg-secondary">
                      <div className="flex h-full">
                        <div className="w-[60%] bg-success" />
                        <div className="w-[25%] bg-destructive/80" />
                        <div className="w-[15%] bg-savings" />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {["Groceries", "Dining Out", "Savings"].map((cat, i) => (
                        <div key={cat} className="rounded-lg border border-border bg-secondary/30 p-4">
                          <p className="text-sm font-medium text-foreground">{cat}</p>
                          <div className="mt-2 flex items-end justify-between">
                            <p className="text-lg font-bold text-foreground">
                              ${[285, 168, 450][i]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              of ${[400, 150, 450][i]}
                            </p>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                            <div 
                              className={`h-full ${i === 1 ? 'bg-warning' : 'bg-primary'}`}
                              style={{ width: `${[71, 112, 100][i]}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating decoration */}
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-2xl bg-accent/20 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-2xl bg-primary/20 blur-2xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="border-y border-border bg-secondary/30 py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-20 py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Budgeting made ridiculously simple
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              No spreadsheets. No complicated formulas. Just a clear view of your money 
              and where it should go.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-20 border-t border-border bg-secondary/20 py-20 md:py-32">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Start free, upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlighted 
                    ? "border-primary bg-card shadow-xl shadow-primary/10" 
                    : "border-border bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-success" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/signup">
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <p className="mt-8 text-center text-sm text-muted-foreground">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-mt-20 py-20 md:py-32">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Frequently asked questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Budget Buddy
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-secondary/30"
                >
                  <span className="font-semibold text-foreground">{faq.question}</span>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      openFaq === index ? "rotate-180" : ""
                    }`} 
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t border-border px-5 py-4">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary/5 py-20 md:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Ready to take control of your money?
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Join thousands of people who finally feel confident about their finances. 
            It takes less than 5 minutes to get started.
          </p>
          <Link href="/signup">
            <Button variant="hero" className="group">
              Start Your Free Budget
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <PiggyBank className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Budget Buddy</span>
            </div>
            <div className="flex gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
              <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Budget Buddy. Making budgeting simple for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
