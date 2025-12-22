"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PiggyBank, ArrowLeft, Shield, Lock, Eye, UserCheck, Trash2, Globe, Mail } from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  {
    id: "introduction",
    title: "Introduction",
    icon: Shield,
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    icon: Eye,
  },
  {
    id: "how-we-use-your-information",
    title: "How We Use Your Information",
    icon: UserCheck,
  },
  {
    id: "information-sharing",
    title: "Information Sharing",
    icon: Globe,
  },
  {
    id: "data-security",
    title: "Data Security",
    icon: Lock,
  },
  {
    id: "data-retention",
    title: "Data Retention",
    icon: Trash2,
  },
  {
    id: "your-rights",
    title: "Your Rights and Choices",
    icon: UserCheck,
  },
  {
    id: "contact",
    title: "Contact Us",
    icon: Mail,
  },
];

export default function PrivacyPolicy() {
  const lastUpdated = "December 14, 2025";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <PiggyBank className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Budget Buddy</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Your privacy matters to us
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="border-y border-border bg-secondary/30 py-8">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Navigation
          </h2>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <section.icon className="h-4 w-4 text-primary" />
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="introduction"
              className="scroll-mt-24 mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground m-0">Introduction</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Budget Buddy! We're committed to protecting your privacy and being transparent about how we handle your personal information. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Budget Buddy is a personal budgeting application that helps you track your spending, manage your money, and achieve your financial goals. We understand that financial data is sensitive, and we take our responsibility to protect it seriously.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  By using Budget Buddy, you agree to the collection and use of information in accordance with this policy. If you do not agree with our practices, please do not use our services.
                </p>
              </div>
            </motion.div>

            {/* Information We Collect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="information-we-collect"
              className="scroll-mt-24 mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground m-0">Information We Collect</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Account Information</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    When you create an account, we collect:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Your email address</li>
                    <li>Your name (if provided)</li>
                    <li>Password (stored in encrypted form)</li>
                    <li>Account preferences and settings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Financial Information</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    To provide our budgeting services, we collect:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Bank account and credit card transaction data (through secure connections via Plaid)</li>
                    <li>Account balances and names</li>
                    <li>Transaction history, including amounts, dates, and merchant names</li>
                    <li>Budget categories and amounts you create</li>
                    <li>Savings goals and progress</li>
                  </ul>
                  <div className="mt-4 rounded-lg bg-success/10 border border-success/20 p-4">
                    <p className="text-sm text-foreground font-medium mb-1">
                      🔒 Important: We never store your bank login credentials
                    </p>
                    <p className="text-sm text-muted-foreground">
                      When you connect your bank accounts, we use Plaid, a trusted third-party service. Your bank username and password are entered directly into Plaid's secure system — we never see or store them.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Usage Information</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    We automatically collect certain information when you use Budget Buddy:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Device information (browser type, operating system)</li>
                    <li>IP address and general location (country/region)</li>
                    <li>Pages visited and features used</li>
                    <li>Date and time of access</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* How We Use Your Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="how-we-use-your-information"
              className="scroll-mt-24 mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground m-0">How We Use Your Information</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We use your information to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Provide our services:</strong> Display your transactions, calculate budgets, track goals, and generate reports</li>
                  <li><strong className="text-foreground">Improve your experience:</strong> Personalize features, remember your preferences, and suggest budget categories</li>
                  <li><strong className="text-foreground">Communicate with you:</strong> Send important account notifications, security alerts, and (with your permission) helpful tips</li>
                  <li><strong className="text-foreground">Maintain security:</strong> Detect and prevent fraud, abuse, or unauthorized access</li>
                  <li><strong className="text-foreground">Improve our product:</strong> Analyze usage patterns to make Budget Buddy better for everyone</li>
                  <li><strong className="text-foreground">Comply with legal obligations:</strong> Meet legal and regulatory requirements</li>
                </ul>
                <div className="mt-4 rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <p className="text-sm text-foreground font-medium mb-1">
                    We do NOT:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Sell your personal information to third parties</li>
                    <li>Use your financial data for advertising purposes</li>
                    <li>Share your data with marketers</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Information Sharing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="information-sharing"
              className="scroll-mt-24 mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground m-0">Information Sharing</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  We only share your information in limited circumstances:
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Service Providers</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We work with trusted third parties who help us operate our services:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
                    <li><strong className="text-foreground">Plaid:</strong> Securely connects your bank accounts and retrieves transaction data</li>
                    <li><strong className="text-foreground">Cloud hosting providers:</strong> Store and process your data on secure servers</li>
                    <li><strong className="text-foreground">Payment processors:</strong> Handle subscription payments (they do not have access to your budget data)</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    These providers are contractually bound to protect your data and only use it for the specific services they provide to us.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Legal Requirements</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may disclose your information if required to do so by law, such as in response to a subpoena, court order, or other legal process. We will notify you of such requests when legally permitted.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">With Your Consent</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may share information with other parties when you explicitly consent to such sharing.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Data Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="data-security"
              className="scroll-mt-24 mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground m-0">Data Security</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We take the security of your data seriously and implement industry-standard measures to protect it:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Encryption in transit:</strong> All data transmitted between your device and our servers is encrypted using TLS (Transport Layer Security)</li>
                  <li><strong className="text-foreground">Encryption at rest:</strong> Your data is encrypted when stored on our servers using AES-256 encryption</li>
                  <li><strong className="text-foreground">Secure authentication:</strong> We use secure password hashing and support multi-factor authentication</li>
                  <li><strong className="text-foreground">Regular security audits:</strong> We regularly review and update our security practices</li>
                  <li><strong className="text-foreground">Access controls:</strong> Only authorized personnel have access to user data, and access is logged and monitored</li>
                  <li><strong className="text-foreground">Secure infrastructure:</strong> Our services run on enterprise-grade cloud infrastructure with built-in security features</li>
                </ul>
                <div className="mt-4 rounded-lg bg-warning/10 border border-warning/20 p-4">
                  <p className="text-sm text-foreground font-medium mb-1">
                    Your role in security
                  </p>
                  <p className="text-sm text-muted-foreground">
                    While we work hard to protect your data, security is a shared responsibility. We recommend using a strong, unique password and enabling two-factor authentication when available.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Data Retention */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="data-retention"
              className="scroll-mt-24 mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Trash2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground m-0">Data Retention</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as your account is active or as needed to provide you services. Specifically:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Active accounts:</strong> Your data is retained for the duration of your account</li>
                  <li><strong className="text-foreground">Deleted accounts:</strong> When you delete your account, we delete or anonymize your personal data within 30 days, except where retention is required by law</li>
                  <li><strong className="text-foreground">Backups:</strong> Data in our backup systems may take up to 90 days to be fully removed</li>
                  <li><strong className="text-foreground">Legal requirements:</strong> We may retain certain information as required by law (e.g., for tax or legal compliance)</li>
                </ul>
              </div>
            </motion.div>

            {/* Your Rights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="your-rights"
              className="scroll-mt-24 mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground m-0">Your Rights and Choices</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  You have several rights regarding your personal data:
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-semibold text-foreground mb-2">Access Your Data</h4>
                    <p className="text-sm text-muted-foreground">
                      You can request a copy of all personal data we hold about you.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-semibold text-foreground mb-2">Correct Your Data</h4>
                    <p className="text-sm text-muted-foreground">
                      You can update or correct inaccurate information in your account settings.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-semibold text-foreground mb-2">Delete Your Data</h4>
                    <p className="text-sm text-muted-foreground">
                      You can delete your account and all associated data at any time.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-semibold text-foreground mb-2">Export Your Data</h4>
                    <p className="text-sm text-muted-foreground">
                      You can download your data in a portable format (PDF or Excel).
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-semibold text-foreground mb-2">Disconnect Banks</h4>
                    <p className="text-sm text-muted-foreground">
                      You can disconnect your linked bank accounts at any time from Settings.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-semibold text-foreground mb-2">Opt Out of Communications</h4>
                    <p className="text-sm text-muted-foreground">
                      You can unsubscribe from non-essential emails using the link in any email.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">For California Residents</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Under the California Consumer Privacy Act (CCPA), you have additional rights including the right to know what personal information we collect, the right to delete, and the right to opt-out of the sale of personal information. Note: We do not sell your personal information.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">For European Residents</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Under the General Data Protection Regulation (GDPR), you have rights including access, rectification, erasure, data portability, and the right to object to processing. To exercise these rights, please contact us at the email below.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              id="contact"
              className="scroll-mt-24 mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground m-0">Contact Us</h2>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, your personal data, or would like to exercise your rights, please contact us:
                </p>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <p className="text-foreground font-medium">Budget Buddy Privacy Team</p>
                  <p className="text-muted-foreground">Email: privacy@budgetbuddy.app</p>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  We aim to respond to all privacy-related inquiries within 30 days.
                </p>
              </div>
            </motion.div>

            {/* Changes to Policy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="rounded-xl border border-border bg-secondary/30 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Changes to This Policy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date. For material changes, we will also send you an email notification. We encourage you to review this policy periodically.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <PiggyBank className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Budget Buddy</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/privacy-policy" className="text-foreground font-medium">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Budget Buddy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
