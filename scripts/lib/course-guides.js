const CHECKED = "2026-10-05";
const GOOGLE_COURSE = "https://skillshop.exceedlms.com/student/collection/1830706?locale=en";
const GOOGLE_AWARD = "https://support.google.com/skillshop/answer/18072892?hl=en";
const MICROSOFT_FAQ = "https://learn.microsoft.com/en-us/training/support/faq";
const CS50 = "https://cs50.harvard.edu/x/";
const CS50_FAQ = "https://cs50.harvard.edu/x/faqs/";
const CS50_CERTIFICATE = "https://cs50.harvard.edu/x/certificate/";

const COURSE_GUIDE = {
  slug: "free-online-courses-south-africa",
  title: "Free Online Courses South Africa | Digital Skills & Certificates",
  description: "Compare Google Skillshop, Microsoft Learn and CS50x: learning costs, completion awards, certificate requirements and practical checks for South African learners.",
  heading: "Free Online Courses in South Africa",
  intro: "Choose a course by the skill you want to practise, the award you can earn and the costs beyond the lessons. Free learning, a completion badge and a professional certification are different things.",
  eyebrow: "Learning guides",
  article: true,
  datePublished: "2026-05-27",
  dateModified: CHECKED,
  actions: [{ label: "Compare learning options", href: "#course-comparison", className: "btn--primary" }, { label: "CS50 certificate explained", href: "/cs50-free-certificate-explained/", className: "btn--secondary" }],
  trustItems: ["Sources checked 5 October 2026", "Certificate costs explained", "Data costs still apply"],
  resourceCategories: ["online-courses"],
  resourceTitle: "More official learning and access resources",
  resourceIntro: "These directory links include online learning and local access support. Check each provider's current terms; the review date on each card applies to that resource.",
  sections: [
    {
      id: "course-comparison",
      heading: "Compare learning, awards and extra costs",
      paragraphs: ["This comparison covers the provider pages checked on 5 October 2026. It does not mean every course on a platform is free, or that every award is an accredited qualification."],
      table: {
        caption: "Learning options and what to check before enrolling",
        headers: ["Option and skill goal", "Learning cost", "Completion evidence", "Time and practical requirements"],
        rows: [
          ["Google Skillshop: digital marketing", "Google confirms free Google Ads training. Confirm the terms for your selected course; the Fundamentals course page does not state a price.", "Fundamentals of Digital Marketing awards a digital badge after completion, rather than the old Digital Garage certificate.", "Fundamentals is listed as beginner level, 40 hours and self-paced. Sign in to track completion."],
          ["Microsoft Learn: Microsoft products and technical skills", "Training content is free. Azure exercises may require a subscription and incur usage costs; certification exams can cost extra.", "Module badges and learning-path trophies record progress. They are distinct from assessed credentials.", "Choose a module for its prerequisites and duration. A profile saves progress; check software and subscription requirements."],
          ["CS50x: computer science and programming", "OpenCourseWare and the CS50 completion certificate are free. The optional edX verified certificate is paid.", "The free certificate requires at least 70% on every required problem set and the final project.", "Eleven weeks of material, taken at your own pace. Allow time for coding assignments, an edX account and the final project."],
        ],
      },
      sources: [{ label: "Google: free Skillshop training", href: "https://support.google.com/google-ads/answer/7539883?hl=en" }, { label: "Google: Fundamentals course details", href: GOOGLE_COURSE }, { label: "Microsoft: training and exercise requirements", href: MICROSOFT_FAQ }, { label: "CS50x: official course and study workflow", href: CS50 }],
    },
    {
      heading: "Google: use the current course and award rules",
      paragraphs: ["Grow with Google's Africa site links to Fundamentals of Digital Marketing on Skillshop. Start there rather than relying on an old Digital Skills or Digital Garage link.", "Google's award guidance says to complete all course modules and activities. The current course has no separate final assessment and issues a digital award instead of the former certificate. Do not confuse it with a Google Career Certificate programme."],
      sources: [{ label: "Grow with Google: Africa training directory", href: "https://grow.google/intl/ssa-en/" }, { label: "Google: current completion award rules", href: GOOGLE_AWARD }],
    },
    {
      heading: "Microsoft: budget for practical exercises",
      paragraphs: ["Microsoft's FAQ says the former Learn sandboxes are no longer available. For Azure exercises, check the subscription requirements before creating resources. Read trial limits and billing terms, and remove chargeable resources when finished.", "If your goal is a credential, check its assessment or exam page separately. Completing a learning path alone does not mean you have passed a certification exam."],
      sources: [{ label: "Microsoft Learn: costs, achievements and sandbox changes", href: MICROSOFT_FAQ }],
    },
    {
      heading: "CS50x: a free certificate with work attached",
      paragraphs: ["CS50x introduces computer science through topics including C, Python, SQL and web development. It is open to learners with or without previous programming experience; watching the lectures alone is not enough for the certificate.", "Choose it if you want to build programming skills and complete a project. For the registration steps and free-versus-paid certificate distinction, read our CS50 explainer."],
      sources: [{ label: "CS50x: free certificate requirements", href: CS50_CERTIFICATE }],
    },
    {
      heading: "Plan around South African access and your goal",
      paragraphs: ["Budget for internet data, device access and any required software. Free course access does not establish zero-rated data. A laptop or desktop is a practical choice for coding assignments; check the course tools before starting on a phone.", "Choose one outcome you can demonstrate: a marketing plan for a small business, a completed technical module or a working coding project. Read the first assignment before committing to a long course. Check any country, age and account restrictions on the provider's registration route.", "Freehub has not verified that these awards carry South African academic credit or professional recognition. Ask your institution or employer what evidence they accept. A course does not guarantee a job."],
    },
  ],
  checklistTitle: "Before you start",
  checklist: ["Separate lesson access, completion awards, assessed credentials and exam fees.", "Check prerequisites, estimated study time, registration and local eligibility.", "Check data, software and cloud subscription costs before activating a trial.", "Use the current provider page and keep a link to your completed work."],
  avoidTitle: "Course red flags",
  avoid: ["Guaranteed job promises without placement terms.", "Unofficial certificate or enrolment fees sent through private messages.", "Claims that every course on a platform includes a free certificate.", "Requests for identity documents without clear provider and purpose information."],
  faq: [
    { question: "Does free learning include a free certificate?", answer: "It depends on the course. CS50x offers its own free completion certificate after the required work; the edX verified certificate is paid. Microsoft Learn achievements are different from certification credentials. Google's current Fundamentals course awards a digital badge." },
    { question: "Which option should a beginner choose?", answer: "For digital marketing, examine Google's beginner-level Fundamentals course. For Microsoft tools, pick a relevant Learn module. For computer science, CS50x welcomes learners without prior programming experience but requires substantial assignment work." },
    { question: "Are these courses zero-rated in South Africa?", answer: "This guide does not establish zero-rated access. Check your mobile network's current terms and budget for data, especially videos and practical exercises." },
  ],
  links: [{ label: "CS50 free certificate explained", href: "/cs50-free-certificate-explained/" }, { label: "Student benefits and discounts", href: "/student-freebies-discounts-south-africa/" }, { label: "Free stuff guide", href: "/free-stuff-south-africa/" }],
};

const CS50_GUIDE = {
  slug: "cs50-free-certificate-explained",
  title: "Is the CS50 Certificate Free? CS50x vs edX Explained | FreeHub",
  description: "Understand the free CS50x certificate, optional paid edX verification, assignment requirements and registration steps before starting Harvard's online computer science course.",
  heading: "Is the CS50 certificate free?",
  intro: "Yes: CS50x offers a free certificate from CS50 after you complete the required work. The optional verified certificate sold by edX is a separate, paid choice. Here is how to choose the right route.",
  eyebrow: "Learning explainer · CS50x",
  article: true,
  datePublished: CHECKED,
  dateModified: CHECKED,
  actions: [{ label: "Open the official CS50x course", href: CS50, className: "btn--primary" }, { label: "Compare other courses", href: "/free-online-courses-south-africa/", className: "btn--secondary" }],
  trustItems: ["Sources checked 5 October 2026", "Free and paid routes separated", "Assignments required"],
  sections: [
    {
      heading: "Two certificates, two routes",
      paragraphs: ["The free CS50 Certificate records completion through CS50 itself. The edX verified certificate adds edX's verification route and requires payment. You do not need to buy the verified certificate to qualify for the free one."],
      table: {
        caption: "CS50x certificate choices",
        headers: ["Choice", "Payment", "What you must do"],
        rows: [["CS50 Certificate", "Free", "Register with edX and complete the required coursework at the passing score."], ["edX verified certificate", "Paid; check the current price with edX", "Follow the verified track's requirements as well as completing the coursework."]],
      },
      sources: [{ label: "CS50: certificate types and registration FAQ", href: CS50_FAQ }],
    },
    {
      heading: "What you must finish for the free certificate",
      paragraphs: ["Submit every required problem set and the final project, and earn at least 70% on each. Completing 70% of the course is not the same as reaching the passing score on all required work.", "Lectures are preparation for the assignments. Use the course menu and CS50 Gradebook to check what is still outstanding rather than treating watched videos as completion. Follow the academic honesty rules when solving and submitting your work."],
      sources: [{ label: "CS50: free certificate requirements", href: CS50_CERTIFICATE }, { label: "CS50: coursework and progress FAQ", href: CS50_FAQ }, { label: "CS50: academic honesty policy", href: "https://cs50.harvard.edu/x/honesty/" }],
    },
    {
      heading: "How to start without buying verification",
      paragraphs: ["Begin at the official CS50x OpenCourseWare page and follow its study workflow: lectures, problem sets and a final project. Create an edX account as directed so you can submit work for feedback.", "Registration with edX is required for either certificate. The CS50 FAQ directs learners seeking the free route to choose the free or audit option. Read each selection carefully if edX displays a paid upgrade. Keep using the same accounts so your work can be tracked."],
      sources: [{ label: "CS50x: official starting page", href: CS50 }, { label: "CS50: free registration instructions", href: CS50_FAQ }],
    },
    {
      heading: "Plan for assignments, not just video time",
      paragraphs: ["The course covers eleven weeks of material, with topics including C, algorithms, Python, SQL and web development. You can study at your own pace, but the labels describe the material rather than a promise that everyone finishes in eleven calendar weeks.", "Plan regular time to write code, debug it and build the final project. South African learners should budget for internet access and check that the required tools work on their device. This guide does not verify zero-rated data or access on every device. Check the official FAQ for the current overall completion deadline before planning your study schedule."],
      sources: [{ label: "CS50x: topics and study workflow", href: CS50 }, { label: "CS50: current deadline and course FAQ", href: CS50_FAQ }],
    },
    {
      heading: "How to describe the result honestly",
      paragraphs: ["CS50 says its free and verified certificates are not accredited academic offerings from Harvard or its affiliates. They do not make you a Harvard degree graduate. Ask your institution directly about any credit or recognition you need.", "On a CV, identify the course and the certificate route you actually completed. For example, after earning the free award, you could write: CS50x: Introduction to Computer Science — CS50 Certificate. Add a link to your final project and describe what you built. That gives a reader evidence of your work without implying a degree or a guaranteed employment outcome."],
      sources: [{ label: "CS50: academic recognition explained", href: CS50_FAQ }],
    },
  ],
  checklistTitle: "Before enrolling",
  checklist: ["Choose the free route if you want the CS50 Certificate without paid verification.", "Check all required assignments and the current deadline.", "Check your device, internet access and account requirements.", "Decide whether an employer or institution actually needs edX verification before paying."],
  faq: [
    { question: "Can I get the free certificate just by watching lectures?", answer: "No. You must submit the required problem sets and final project and reach at least 70% on each." },
    { question: "Do I have to pay edX to get the CS50 Certificate?", answer: "No. CS50 offers its own free certificate. Register with edX using the free or audit route; the verified certificate is an optional paid choice." },
    { question: "Is the free CS50 certificate a Harvard degree?", answer: "No. CS50's FAQ says its free and verified certificates are not accredited academic offerings from Harvard or its affiliates." },
  ],
  links: [{ label: "Compare free online courses", href: "/free-online-courses-south-africa/" }, { label: "Student benefits and discounts", href: "/student-freebies-discounts-south-africa/" }, { label: "FreeHub blog", href: "/blog/" }],
};

module.exports = { COURSE_GUIDE, CS50_GUIDE };
