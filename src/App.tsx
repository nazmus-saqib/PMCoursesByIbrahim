import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  MoveUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Video,
  Users,
  Globe2,
  BookOpen,
  Layers3,
  Workflow,
  Compass,
  Search,
  Plus,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { courses, site, faqs, process, type Course } from "./data/site";

const isDemo = import.meta.env.MODE === "demo";

const courseIcons = [Compass, Workflow, Layers3, Globe2];
type ModalState =
  | { type: "course"; course: Course }
  | { type: "register"; courseId?: string; team?: boolean }
  | { type: "privacy" }
  | null;

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`logo ${light ? "logo-light" : ""}`}
      href="#home"
      aria-label={`${site.brand} home`}
    >
      <span className="logo-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        {site.brand.toLowerCase()}
        <b>.</b>
      </span>
    </a>
  );
}

function Modal({
  children,
  onClose,
  titleId,
  className = "",
}: {
  children: ReactNode;
  onClose: () => void;
  titleId: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
      queueMicrotask(() => {
        if (opener.current?.isConnected)
          opener.current.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${className}`}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className="modal-close icon-button"
        aria-label="Close dialog"
        onClick={onClose}
      >
        <X size={22} />
      </button>
      {children}
    </dialog>
  );
}

function formatDate(value: string, timezone?: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "To be announced";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: value.length === 10 ? "UTC" : timezone || "UTC",
  }).format(date);
}

function CourseArt({ index, color }: { index: number; color: string }) {
  const Icon = courseIcons[index];
  return (
    <div className={`course-art art-${color}`} aria-hidden="true">
      <span className="art-label">LEARNING PATH / 0{index + 1}</span>
      <div className={`art-object object-${index}`}>
        <span className="art-orbit orbit-one" />
        <span className="art-orbit orbit-two" />
        <span className="art-tile">
          <Icon strokeWidth={1.4} size={49} />
        </span>
        <span className="art-accent">
          <MoveUpRight size={21} />
        </span>
      </div>
      <span className="art-bottom">
        {
          [
            "MAKE IT HAPPEN.",
            "THINK FORWARD.",
            "LEAD WITH CLARITY.",
            "CREATE MORE VALUE.",
          ][index]
        }
      </span>
    </div>
  );
}

function Registration({
  courseId,
  team,
  onPrivacy,
}: {
  courseId?: string;
  team?: boolean;
  onPrivacy: () => void;
}) {
  const [selectedCourse, setSelectedCourse] = useState(courseId || "");
  const [cohortId, setCohortId] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const currentCourse = courses.find((course) => course.id === selectedCourse);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDemo) {
      setDemoSubmitted(true);
      return;
    }
    if (state === "sending") return;
    const data = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          goal: data.get("goal"),
          courseId: selectedCourse,
          cohortId: cohortId || undefined,
          consent: data.get("consent") === "on",
          website: data.get("website"),
        }),
      });
      const result = await response.json().catch(() => null);
      const fieldLabels: Record<string, string> = {
        name: "Full name",
        email: "Email address",
        courseId: "Course",
        cohortId: "Class",
        phone: "Phone number",
        goal: "Learning goals",
        consent: "Consent",
      };
      const details = result?.fieldErrors
        ? Object.entries(result.fieldErrors as Record<string, string>)
            .map(
              ([field, message]) =>
                `${fieldLabels[field] || "Form"}: ${message}`,
            )
            .join(" ")
        : "";
      if (!response.ok || !result?.reference)
        throw new Error(
          details ||
            result?.error ||
            "We could not save your request. Please try again.",
        );
      setReference(result.reference);
      setState("success");
    } catch (reason) {
      setError(
        reason instanceof TypeError
          ? "Please check your connection and try again."
          : reason instanceof Error
            ? reason.message
            : "Please check your connection and try again.",
      );
      setState("idle");
    }
  }
  if (state === "success")
    return (
      <div className="registration-success" role="status">
        <span className="success-icon">
          <CheckCircle2 size={35} />
        </span>
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h2 id="registration-title">
          You’ve taken
          <br />
          the first step.
        </h2>
        <p>
          Your interest in <strong>{currentCourse?.name}</strong> has been
          recorded. Dates, fees, and availability still need to be agreed before
          your place is confirmed.
        </p>
        <div className="reference-box">
          <span>Your request reference</span>
          <strong>{reference}</strong>
        </div>
        <p className="fine-print">
          Keep this reference for your records. This website does not send an
          automatic confirmation email.
        </p>
      </div>
    );
  return (
    <>
      <p className="eyebrow">LET’S MOVE YOU FORWARD</p>
      <h2 id="registration-title">
        {team ? "Build a stronger team." : "Your next step starts here."}
      </h2>
      <p className="modal-intro">
        {team
          ? "Tell me what your team needs. We’ll discuss a course, schedule, and approach that fit."
          : "Tell me what you’d like to learn. No payment, no commitment—just the start of a conversation."}
      </p>
      {isDemo && (
        <p className="form-notice">
          Design demo: you can try this form. Your details will not be stored or
          sent.
        </p>
      )}
      <form className="registration-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Full name <span>*</span>
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              placeholder="Your full name"
            />
          </label>
          <label>
            Email address <span>*</span>
            <input
              name="email"
              autoComplete="email"
              type="email"
              required
              maxLength={254}
              placeholder="you@example.com"
            />
          </label>
        </div>
        <label>
          Course you’re interested in <span>*</span>
          <select
            name="courseId"
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setCohortId("");
            }}
            required
          >
            <option value="" disabled>
              Select a learning path
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        {currentCourse &&
          (currentCourse.cohorts.length ? (
            <label>
              Preferred class
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
              >
                <option value="">Help me choose a class</option>
                {currentCourse.cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {formatDate(cohort.startDate, cohort.timezone)} –{" "}
                    {formatDate(cohort.endDate, cohort.timezone)} ·{" "}
                    {cohort.timezone}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="form-notice">
              <CalendarDays size={17} /> Class dates are being planned. Register
              to express your interest.
            </p>
          ))}
        <label>
          Phone number <small>(optional)</small>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            placeholder="Include your country code"
          />
        </label>
        <label>
          {team ? "Tell me about your team" : "What would you like to achieve?"}{" "}
          <small>(optional)</small>
          <textarea
            name="goal"
            maxLength={2000}
            rows={3}
            placeholder={
              team
                ? "Team size, learning goals, and preferred timing…"
                : "Your role, learning goals, or any questions…"
            }
          />
        </label>
        <div className="honeypot" aria-hidden="true">
          <label>
            Leave this empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="consent">
          <input name="consent" type="checkbox" required />
          <span>
            I agree that my details can be stored and used to respond to this
            training enquiry.{" "}
            <button type="button" className="text-button" onClick={onPrivacy}>
              Privacy details
            </button>
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {demoSubmitted && (
          <p className="form-notice" role="status">
            Demo complete. The live website will save your request; this preview
            has not stored or sent any details.
          </p>
        )}
        <button
          type="submit"
          className="button button-orange form-submit"
          disabled={state === "sending"}
        >
          {state === "sending"
            ? "Saving your request…"
            : isDemo
              ? "Try registration"
              : "Register my interest"}
          <ArrowUpRight size={18} />
        </button>
        <p className="fine-print">
          A request is not a confirmed booking. Your details are never displayed
          publicly.
        </p>
      </form>
    </>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("All courses");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [showFormPrivacy, setShowFormPrivacy] = useState(false);
  const categories = [
    "All courses",
    "Project management",
    "Agile",
    "IT services",
  ];
  const filtered = courses.filter(
    (course) =>
      (filter === "All courses" ||
        (filter === "Project management" &&
          ["project-management", "prince2"].includes(course.id)) ||
        (filter === "Agile" && course.id === "agile") ||
        (filter === "IT services" && course.id === "it-service-management")) &&
      `${course.name} ${course.description} ${course.category}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  const register = (courseId?: string, team = false) => {
    setShowFormPrivacy(false);
    setModal({ type: "register", courseId, team });
    setMenuOpen(false);
  };
  const closeModal = () => {
    setModal(null);
    setShowFormPrivacy(false);
  };
  const upcoming = courses
    .flatMap((course) => course.cohorts.map((cohort) => ({ course, cohort })))
    .sort((a, b) => a.cohort.startDate.localeCompare(b.cohort.startDate));
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container nav-container">
          <Logo />
          <nav
            className={menuOpen ? "navigation is-open" : "navigation"}
            aria-label="Main navigation"
          >
            <a href="#courses" onClick={() => setMenuOpen(false)}>
              Explore courses
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)}>
              Meet Ibrahim
            </a>
            <a href="#schedule" onClick={() => setMenuOpen(false)}>
              Upcoming classes
            </a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>
              FAQs
            </a>
          </nav>
          <button
            className="button button-dark nav-cta"
            onClick={() => register()}
          >
            Let’s learn together
            <ArrowUpRight size={17} />
          </button>
          <button
            className="menu-toggle icon-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {isDemo && (
        <aside className="demo-banner" aria-label="Website preview">
          LEARN X DESIGN DEMO{" "}
          <span>
            Explore the courses, menus, and forms. Enrollment submissions are
            disabled.
          </span>
        </aside>
      )}
      <main id="main">
        <section className="hero container" id="home">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" /> YOUR AMBITION. YOUR NEXT CHAPTER.
            </p>
            <h1>
              Build the skills.
              <br />
              Lead the <em>change.</em>
            </h1>
            <p className="hero-description">
              Big career moves start with practical skills. Learn project
              management, Agile, and more through live classes that connect
              knowledge to the real world.
            </p>
            <div className="hero-actions">
              <a href="#courses" className="button button-orange">
                Explore the courses
                <ArrowUpRight size={19} />
              </a>
              <a href="#about" className="quiet-link">
                Meet your trainer
                <ArrowRight size={18} />
              </a>
            </div>
            <div className="hero-note">
              <span className="note-icon">
                <Users size={18} />
              </span>
              <p>
                For curious professionals.
                <br />
                <strong>For the leader you’re becoming.</strong>
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap">
              <img
                className="hero-image"
                src="/images/workshop.webp"
                alt="Illustration of professionals learning together in a collaborative workshop"
                fetchPriority="high"
                width="1448"
                height="1086"
              />
              <span className="photo-label">
                <span /> LEARNING IS BETTER TOGETHER
              </span>
            </div>
            <div className="floating-lesson">
              <span className="floating-icon">
                <Sparkles size={20} />
              </span>
              <div>
                <strong>Less theory on a shelf.</strong>
                <span>More skills in your everyday.</span>
              </div>
            </div>
            <div className="hero-stamp" aria-hidden="true">
              <MoveUpRight size={32} />
              <span>
                GROW WITH
                <br />
                PURPOSE
              </span>
            </div>
            <span className="visual-caption">
              A little learning. A bigger possibility.
            </span>
          </div>
        </section>
        <section className="benefits" aria-label="Learning approach">
          <div className="container benefits-inner">
            <div>
              <Video />
              <span>Live, interactive classes</span>
            </div>
            <div>
              <BookOpen />
              <span>Practical, relevant learning</span>
            </div>
            <div>
              <Users />
              <span>Space to ask questions</span>
            </div>
            <div>
              <Compass />
              <span>Skills for your next step</span>
            </div>
          </div>
        </section>
        <section className="courses-section section-pad container" id="courses">
          <div className="section-heading">
            <div>
              <p className="eyebrow">INVEST IN WHAT’S NEXT</p>
              <h2>
                A learning path.
                <br />A world of <em>possibility.</em>
              </h2>
            </div>
            <p>
              Find the skills that meet you where you are,
              <br className="desktop-break" /> and take you where you want to
              go.
            </p>
          </div>
          <div className="catalog-controls">
            <div className="filter-tabs" aria-label="Filter courses">
              {categories.map((category) => (
                <button
                  key={category}
                  className={filter === category ? "filter active" : "filter"}
                  aria-pressed={filter === category}
                  onClick={() => setFilter(category)}
                >
                  {category}
                  {category === "All courses" && <span>04</span>}
                </button>
              ))}
            </div>
            <label className="course-search">
              <Search size={17} />
              <span className="sr-only">Search courses</span>
              <input
                type="search"
                placeholder="Find a course"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <div className="course-grid" aria-live="polite">
            {filtered.length ? (
              filtered.map((course) => (
                <article className="course-card" key={course.id}>
                  <CourseArt
                    index={courses.indexOf(course)}
                    color={course.color}
                  />
                  <div className="course-card-body">
                    <p className="course-category">
                      <span />
                      {course.category}
                    </p>
                    <h3>{course.name}</h3>
                    <p className="course-description">
                      {course.shortDescription}
                    </p>
                    <div className="course-meta">
                      <span>
                        <Video size={14} />
                        {course.format}
                      </span>
                      <span>
                        <CalendarDays size={14} />
                        {course.cohorts.length
                          ? `Next: ${formatDate(course.cohorts[0].startDate, course.cohorts[0].timezone)}`
                          : "Dates coming soon"}
                      </span>
                    </div>
                    <button
                      className="course-link"
                      onClick={() => setModal({ type: "course", course })}
                    >
                      Explore course
                      <span>
                        <ArrowUpRight size={18} />
                      </span>
                      <span className="sr-only">: {course.name}</span>
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-courses">
                <Search size={27} />
                <h3>No courses found</h3>
                <p>Try another search or explore all four learning paths.</p>
                <button
                  className="text-button"
                  onClick={() => {
                    setFilter("All courses");
                    setQuery("");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
          <p className="catalog-footnote">
            <span className="status-dot" /> New class schedules are in the
            works.{" "}
            <button className="text-button" onClick={() => register()}>
              Be part of what’s next
              <ArrowRight size={14} />
            </button>
          </p>
        </section>
        <section className="about-section" id="about">
          <div className="container about-grid">
            <div className="about-art">
              <div className="about-art-head">
                <span>A NOTE FROM IBRAHIM HOSSAIN</span>
                <ArrowUpRight size={21} />
              </div>
              <div className="monogram">
                i<span>.</span>
              </div>
              <span className="about-art-ring" />
              <div className="about-art-foot">
                <span>
                  GOOD QUESTIONS.
                  <br />
                  NEW PERSPECTIVES.
                  <br />
                  REAL PROGRESS.
                </span>
                <span className="small-logo-mark">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <span className="about-tag">
                <CheckCircle2 size={17} />
                Learning, with a human touch.
              </span>
            </div>
            <div className="about-copy">
              <p className="eyebrow">A TRAINER. A GUIDE. IN YOUR CORNER.</p>
              <h2>
                Hi, I’m {site.firstName}.<br />
                Let’s turn potential
                <br />
                into <em>progress.</em>
              </h2>
              <p>{site.bio}</p>
              <p>
                Whether you’re stepping into a new role, finding a better way to
                lead, or developing your team, there’s room here to ask,
                practise, and grow.
              </p>
              <div className="about-principles">
                <span>
                  <Check size={16} />
                  10 years of training experience
                </span>
                <span>
                  <Check size={16} />
                  Ideas you can apply
                </span>
                <span>
                  <Check size={16} />
                  Conversations that count
                </span>
                <span>
                  <Check size={16} />A focus on your goals
                </span>
              </div>
              <button className="quiet-link" onClick={() => register()}>
                Tell me what you’d like to learn
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </section>
        <section
          className="container section-pad schedule-section"
          id="schedule"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">MAKE ROOM FOR YOUR NEXT CHAPTER</p>
              <h2>
                Good things
                <br />
                are <em>coming up.</em>
              </h2>
            </div>
            <p>
              Live classes. Shared ambition.
              <br />
              Find a time to move yourself forward.
            </p>
          </div>
          <div className="schedule-box">
            <div className="schedule-labels">
              <span>YOUR LEARNING PATH</span>
              <span>START DATE</span>
              <span>END DATE</span>
              <span>TAKE THE NEXT STEP</span>
            </div>
            {upcoming.length
              ? upcoming.map(({ course, cohort }) => (
                  <div
                    className="schedule-row"
                    key={`${course.id}-${cohort.id}`}
                  >
                    <div>
                      <span className={`schedule-dot dot-${course.color}`} />
                      <div>
                        <strong>{course.name}</strong>
                        <small>
                          {cohort.label || course.format} · {cohort.timezone}
                        </small>
                      </div>
                    </div>
                    <span data-label="Starts">
                      {formatDate(cohort.startDate, cohort.timezone)}
                    </span>
                    <span data-label="Ends">
                      {formatDate(cohort.endDate, cohort.timezone)}
                    </span>
                    <button
                      className="quiet-link"
                      onClick={() => register(course.id)}
                    >
                      Request a place
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                ))
              : courses.map((course) => (
                  <div className="schedule-row" key={course.id}>
                    <div>
                      <span className={`schedule-dot dot-${course.color}`} />
                      <div>
                        <strong>{course.name}</strong>
                        <small>{course.format}</small>
                      </div>
                    </div>
                    <span data-label="Starts">To be announced</span>
                    <span data-label="Ends">To be announced</span>
                    <button
                      className="quiet-link"
                      onClick={() => register(course.id)}
                    >
                      Register interest
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                ))}
          </div>
          <p className="schedule-note">
            <Clock3 size={15} /> Full dates, session times, and fees are
            confirmed before you book.
          </p>
        </section>
        <section className="process-section">
          <div className="container">
            <div className="process-title">
              <p className="eyebrow">NO LEAPS OF FAITH. JUST A NEXT STEP.</p>
              <h2>
                Your goals. <em>A clear path.</em>
              </h2>
            </div>
            <div className="process-grid">
              {process.map((step) => (
                <div className="process-step" key={step.number}>
                  <span className="step-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="container corporate-section">
          <div className="corporate-card">
            <div className="corporate-copy">
              <p className="eyebrow">BETTER TOGETHER</p>
              <h2>
                One team.
                <br />A whole new <em>potential.</em>
              </h2>
              <p>
                Give your people a shared language for better projects.
                <br className="desktop-break" /> Let’s talk about live training
                shaped around your team.
              </p>
              <button
                className="button button-cream"
                onClick={() => register(undefined, true)}
              >
                Let’s talk team training
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="corporate-art" aria-hidden="true">
              <div className="team-shape shape-one" />
              <div className="team-shape shape-two" />
              <div className="team-shape shape-three" />
              <div className="team-shape shape-four" />
              <span>
                <Users size={44} strokeWidth={1.4} />
              </span>
            </div>
          </div>
        </section>
        <section className="container section-pad faq-section" id="faq">
          <div className="faq-intro">
            <p className="eyebrow">A LITTLE MORE CLARITY</p>
            <h2>
              Great learning
              <br />
              starts with
              <br />
              <em>good questions.</em>
            </h2>
            <p>
              Here are a few answers to help you
              <br className="desktop-break" /> take that next step.
            </p>
            <button className="quiet-link" onClick={() => register()}>
              Ask me something else
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details key={faq.question}>
                <summary>
                  <span className="faq-index">0{index + 1}</span>
                  <span>{faq.question}</span>
                  <Plus size={19} />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <div className="container">
            <span className="eyebrow">THE NEXT CHAPTER IS YOURS.</span>
            <div>
              <h2>
                Let’s make it <em>count.</em>
              </h2>
              <a
                className="circle-link"
                href="#courses"
                aria-label="Explore courses"
              >
                <ArrowUpRight size={34} strokeWidth={1.3} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Logo light />
            <p>
              Practical skills. Fresh perspectives.
              <br />A more confident you.
            </p>
          </div>
          <div className="footer-links">
            <a href="#courses">Explore courses</a>
            <a href="#about">Meet Ibrahim</a>
            <a href="#schedule">Upcoming classes</a>
            <button onClick={() => register()}>
              Let’s connect
              <ArrowUpRight size={14} />
            </button>
            {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
            {site.linkedinUrl && (
              <a href={site.linkedinUrl} target="_blank" rel="noreferrer">
                LinkedIn
                <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} {site.brand}. Keep moving forward.
          </span>
          <div>
            <span>Made for your next chapter.</span>
            <button onClick={() => setModal({ type: "privacy" })}>
              Privacy & enrollment
            </button>
          </div>
        </div>
      </footer>
      {modal?.type === "course" && (
        <Modal
          onClose={closeModal}
          titleId="course-title"
          className="course-modal"
        >
          <span className={`course-modal-icon art-${modal.course.color}`}>
            {(() => {
              const Icon = courseIcons[courses.indexOf(modal.course)];
              return <Icon size={30} />;
            })()}
          </span>
          <p className="eyebrow">{modal.course.eyebrow}</p>
          <h2 id="course-title">{modal.course.name}</h2>
          <p className="modal-intro">{modal.course.description}</p>
          <div className="course-detail-meta">
            <span>
              <Video size={17} />
              {modal.course.format}
            </span>
            <span>
              <CalendarDays size={17} />
              {modal.course.duration}
            </span>
          </div>
          <h3>What you’ll take away</h3>
          <ul className="outcome-list">
            {modal.course.outcomes.map((outcome) => (
              <li key={outcome}>
                <CheckCircle2 size={18} />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
          <h3>A look inside the course</h3>
          <ol className="module-list">
            {modal.course.modules.map((module) => (
              <li key={module}>{module}</li>
            ))}
          </ol>
          <h3>Is this for you?</h3>
          <p>{modal.course.audience}</p>
          {modal.course.note && (
            <p className="detail-note">{modal.course.note}</p>
          )}
          <div className="course-modal-footer">
            <div>
              <strong>{modal.course.priceLabel}</strong>
              <span>No payment needed to enquire</span>
            </div>
            <button
              className="button button-orange"
              onClick={() => register(modal.course.id)}
            >
              Register interest
              <ArrowUpRight size={18} />
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "register" && (
        <Modal
          onClose={closeModal}
          titleId="registration-title"
          className="registration-modal"
        >
          <Registration
            courseId={modal.courseId}
            team={modal.team}
            onPrivacy={() => setShowFormPrivacy(!showFormPrivacy)}
          />
          {showFormPrivacy && (
            <div
              className="inline-privacy"
              role="region"
              aria-label="Privacy details"
            >
              <h3>How your information is used</h3>
              <p>
                Your name, email, selected course, and any optional details are
                stored by this website so the trainer can review your enquiry.
                Please don’t include sensitive information. To ask about or
                remove your request, contact the trainer and quote your request
                reference.
              </p>
            </div>
          )}
        </Modal>
      )}
      {modal?.type === "privacy" && (
        <Modal onClose={closeModal} titleId="privacy-title">
          <p className="eyebrow">CLEAR FROM THE START</p>
          <h2 id="privacy-title">Privacy & enrollment</h2>
          <div className="privacy-content">
            <h3>Your information</h3>
            <p>
              When you submit an enquiry, this website stores your name, email,
              course choice, consent, and any optional phone number or learning
              goals. These details help the trainer review and respond to your
              request. Requests are not displayed publicly.
            </p>
            <h3>Your choices</h3>
            <p>
              Only your name, email, course choice, and consent are required.
              Please avoid including sensitive information. To ask about your
              data or request deletion, contact the trainer with your request
              reference.
              {site.email && (
                <>
                  {" "}
                  Email <a href={`mailto:${site.email}`}>{site.email}</a>.
                </>
              )}
            </p>
            <h3>What registration means</h3>
            <p>
              {site.enrollmentNotice} This form does not take payment or send an
              automated email. The trainer reviews enquiries separately.
            </p>
            <h3>Cookies & imagery</h3>
            <p>
              This site does not use advertising trackers or set analytics
              cookies. The workshop image is an AI-generated illustration of
              collaborative learning.
            </p>
            <h3>Qualifications</h3>
            <p>
              Course editions, qualification levels, exams, and any
              certification arrangements must be confirmed before booking.
              Course names identify the subjects taught and do not imply
              accreditation or endorsement.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
