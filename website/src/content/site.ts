export const siteContent = {
  brand: {
    name: "BlinkGuard",
    productName: "BlinkGuard Operator",
    tagline: "Safe AI execution for Solana",
    description:
      "Simulate, understand, and guard every onchain action before execution.",
  },

  nav: {
    links: [
      { label: "Product", href: "#product" },
      { label: "Demo", href: "/demo" },
      { label: "Architecture", href: "/architecture" },
      { label: "GitHub", href: "https://github.com/jmr0ck/colosseum-jmclaw-action-router" },
    ],
    ctas: [
      { label: "Watch Demo", href: "/demo", primary: true },
      { label: "View GitHub", href: "https://github.com/jmr0ck/colosseum-jmclaw-action-router" },
    ],
  },

  hero: {
    eyebrow: "SAFE AI EXECUTION FOR SOLANA",
    headline:
      "Simulate, understand, and guard every onchain action before execution.",
    subheadline:
      "BlinkGuard Operator turns natural-language intent into simulation-backed, policy-guarded execution for wallets, teams, and autonomous agents.",
    primaryCta: { label: "Watch Demo", href: "/demo" },
    secondaryCta: { label: "View GitHub", href: "https://github.com/jmr0ck/colosseum-jmclaw-action-router" },
    bullets: [
      "Simulation-first",
      "Human-readable explanations",
      "Policy-based approvals",
    ],
    mockIntent: "Swap 100 USDC to SOL safely",
  },

  trustStrip: {
    text: "Built for wallets, teams, traders, and autonomous agents",
    items: [
      "Simulation-first",
      "Explainable",
      "Policy-aware",
      "Solana-native",
      "Open by design",
    ],
  },

  problem: {
    title: "Onchain execution is still too opaque.",
    body:
      "Users are still asked to sign transactions they do not fully understand. As AI agents accelerate onchain activity, trust becomes the bottleneck.",
    pains: [
      {
        title: "Blind signing",
        body: "Complex transactions remain difficult for users to inspect with confidence.",
      },
      {
        title: "Unsafe automation",
        body: "AI can act faster than users can verify what is actually being executed.",
      },
      {
        title: "Irreversible mistakes",
        body: "One bad approval or misunderstood permission can lead to permanent loss.",
      },
    ],
  },

  solution: {
    title: "A trust layer for autonomous and assisted execution.",
    body:
      "BlinkGuard Operator combines natural-language execution, transaction simulation, human-readable explanations, and guardrail policies in one Solana-native workflow.",
    flow: [
      "Intent",
      "Plan",
      "Simulate",
      "Explain",
      "Guard",
      "Approve",
      "Execute",
    ],
  },

  howItWorks: {
    title: "From intent to execution, without signing blind.",
    steps: [
      {
        title: "State your intent",
        body: "Tell the copilot what you want to do in natural language.",
      },
      {
        title: "Review the proposed action",
        body: "See the route, expected output, slippage, and protocol choice before anything moves.",
      },
      {
        title: "Let BlinkGuard inspect it",
        body: "Get simulation, explanation, and risk warnings before signing.",
      },
      {
        title: "Approve with confidence",
        body: "Execute only after the action is understandable and safe enough to proceed.",
      },
    ],
  },

  features: {
    title: "Built for safe onchain execution",
    items: [
      {
        title: "Natural-language commands",
        body: "Express actions simply without manually decoding transaction flows.",
      },
      {
        title: "Simulation-first previews",
        body: "Inspect asset changes, slippage, and expected outcomes before signing.",
      },
      {
        title: "Human-readable explanations",
        body: "Understand what the transaction actually does in plain English.",
      },
      {
        title: "Risk-aware approvals",
        body: "Surface suspicious behaviors and unclear permissions clearly.",
      },
      {
        title: "Policy guardrails",
        body: "Allow, warn, or block actions based on defined safety rules.",
      },
      {
        title: "Execution audit trail",
        body: "Keep a clear record of what was requested, reviewed, and executed.",
      },
    ],
  },

  whySolana: {
    title: "Why Solana",
    body:
      "Solana makes simulation-backed, conversational execution practical with fast finality, low fees, and a highly composable ecosystem.",
    items: [
      {
        title: "Fast finality",
        body: "Enables real-time feedback loops for execution and review.",
      },
      {
        title: "Low fees",
        body: "Makes simulation-rich product workflows practical.",
      },
      {
        title: "Composable ecosystem",
        body: "Supports meaningful cross-protocol actions and integrations.",
      },
      {
        title: "Agent-ready UX",
        body: "Ideal for intent-based products and autonomous workflows.",
      },
    ],
  },

  demoPreview: {
    title: "See the flow",
    exampleRequest: "Swap 100 USDC to SOL safely",
    bullets: [
      "Proposes the route",
      "Simulates token changes",
      "Explains the transaction in plain English",
      "Checks permissions and risk",
      "Requests approval",
      "Logs the execution outcome",
    ],
    cta: { label: "Watch Full Demo", href: "/demo" },
  },

  openSource: {
    title: "Open by design",
    body:
      "BlinkGuard Operator is designed to become a reusable trust layer for the Solana ecosystem.",
    items: [
      "Transaction explanation engine",
      "Simulation and risk interfaces",
      "Policy primitives",
      "Embeddable SDK for wallets, apps, and agents",
    ],
  },

  vision: {
    title: "The future of onchain UX is not just autonomous — it's trustworthy.",
    body:
      "AI will increasingly decide what users do onchain. The missing layer is not more automation. It is simulation, explainability, and trust.",
    closing: "BlinkGuard Operator is building that layer on Solana.",
  },

  finalCta: {
    title: "Never sign blind again.",
    body:
      "Explore the demo, review the architecture, and help build safer execution on Solana.",
    actions: [
      { label: "Watch Demo", href: "/demo", primary: true },
      { label: "View GitHub", href: "https://github.com/jmr0ck/colosseum-jmclaw-action-router" },
      { label: "Read Architecture", href: "/architecture" },
    ],
  },

  footer: {
    note: "BlinkGuard Operator — Built for the Solana Frontier Hackathon.",
    links: [
      { label: "Demo", href: "/demo" },
      { label: "Architecture", href: "/architecture" },
      { label: "GitHub", href: "https://github.com/jmr0ck/colosseum-jmclaw-action-router" },
    ],
  },

  demoPage: {
    hero: {
      eyebrow: "PRODUCT DEMO",
      title: "Watch BlinkGuard Operator in action",
      body:
        "See how intent-based Solana execution becomes simulation-backed, explainable, and safe.",
    },
    happyPath: {
      title: "Happy path",
      request: "Swap 100 USDC to SOL safely",
      steps: [
        {
          title: "Intent captured",
          body: "The user enters a plain-language request instead of manually constructing a transaction.",
        },
        {
          title: "Route proposed",
          body: "Operator selects a candidate route and previews expected output, fees, and slippage.",
        },
        {
          title: "BlinkGuard review",
          body: "Simulation completes, transaction effects are explained in plain English, and safety checks pass.",
        },
        {
          title: "Approval and execution",
          body: "The user approves with confidence and the action is executed with a visible audit trail.",
        },
      ],
    },
    riskPath: {
      title: "Risk path",
      body:
        "When a transaction is unclear, suspicious, or outside expected safety thresholds, BlinkGuard surfaces warnings before anything executes.",
      warnings: [
        "Unexpected approvals or permission changes",
        "Opaque or suspicious transaction behavior",
        "Risk outside user or policy thresholds",
        "Action requires caution or should be blocked entirely",
      ],
    },
  },

  architecturePage: {
    hero: {
      eyebrow: "SYSTEM DESIGN",
      title: "Architecture for trustworthy onchain execution",
      body:
        "BlinkGuard Operator separates planning, simulation, explanation, policy, and execution into reusable modules.",
    },
    pipeline: [
      "User Intent",
      "Planner",
      "Simulation",
      "Explanation",
      "Policy Engine",
      "Approval",
      "Execution",
      "Audit",
    ],
    modules: [
      {
        title: "Intent Layer",
        body: "Parses natural-language intent into supported actions such as swaps, staking, and guarded execution requests.",
      },
      {
        title: "Planning Layer",
        body: "Builds candidate routes and protocol actions based on user intent and supported integrations.",
      },
      {
        title: "BlinkGuard Engine",
        body: "Handles simulation, transaction explanation, risk classification, and policy outcomes.",
      },
      {
        title: "Execution Layer",
        body: "Manages approval gating and transaction dispatch only after review is complete.",
      },
      {
        title: "Audit Layer",
        body: "Records the request, proposed action, simulation result, approval state, and execution outcome.",
      },
    ],
    openSourceTitle: "Reusable by the ecosystem",
    openSourceBody:
      "Core BlinkGuard surfaces can be exposed as reusable primitives for wallets, agents, dapps, and treasury workflows across Solana.",
  },
} as const;
