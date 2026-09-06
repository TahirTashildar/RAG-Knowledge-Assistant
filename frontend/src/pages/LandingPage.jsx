import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🎯',
    title: 'Grounded answers',
    body: 'Every answer is built from chunks retrieved from your uploaded files — not general knowledge pretending to be yours.',
  },
  {
    icon: '🔎',
    title: 'Visible sources',
    body: 'Every answer includes clear source references so you can verify exactly where information came from.',
  },
  {
    icon: '⚡',
    title: 'Smart retrieval',
    body: 'Alternative query generation helps discover relevant information even when your first question does not perfectly match the document.',
  },
  {
    icon: '💬',
    title: 'Real conversations',
    body: 'Ask follow-up questions naturally while the assistant keeps conversation context.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Upload',
    body: 'Add your PDF, TXT, or DOCX documents securely.',
  },
  {
    number: '02',
    title: 'Ask',
    body: 'Ask questions naturally without learning any special commands.',
  },
  {
    number: '03',
    title: 'Discover',
    body: 'Get grounded answers with clear sources and context.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8f6] text-slate-900">

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-200px] left-[-150px] h-[500px] w-[500px] rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute right-[-200px] top-[300px] h-[500px] w-[500px] rounded-full bg-amber/10 blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center text-white font-bold shadow-lg shadow-teal/20 group-hover:scale-105 transition">
            M
          </div>

          <span className="font-serif text-2xl font-semibold text-ink">
            Marginal
          </span>
        </Link>

        <div className="flex items-center gap-3">

          <Link
            to="/login"
            className="hidden sm:block px-4 py-2 text-sm font-medium text-slateink hover:text-ink transition"
          >
            Log in
          </Link>

          <Link
            to="/register"
            className="bg-teal text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-teal/20 hover:bg-teal-dark hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started
          </Link>

        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-28 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left */}
        <div>

          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 px-4 py-2 rounded-full text-sm text-teal-dark mb-7">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            AI-powered document intelligence
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] text-ink tracking-tight mb-7">

            Your documents.

            <span className="block text-teal mt-2">
              Finally searchable.
            </span>

          </h1>

          <p className="text-lg md:text-xl text-slateink leading-relaxed max-w-xl mb-9">

            Upload your documents, ask questions naturally, and get
            intelligent answers backed by the exact information inside your
            files.

          </p>

          <div className="flex flex-col sm:flex-row gap-4">

            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-teal text-white px-7 py-3.5 rounded-xl font-semibold shadow-xl shadow-teal/20 hover:bg-teal-dark hover:-translate-y-1 transition-all duration-200"
            >
              Start Exploring
              <span>→</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-slate-300 bg-white/60 backdrop-blur font-medium text-ink hover:border-teal hover:text-teal transition"
            >
              Log in
            </Link>

          </div>

          {/* Stats */}

          <div className="flex gap-8 mt-12 pt-8 border-t border-slate-200">

            <div>
              <p className="text-2xl font-semibold text-ink">
                RAG
              </p>

              <p className="text-sm text-slateink">
                Powered retrieval
              </p>
            </div>

            <div>
              <p className="text-2xl font-semibold text-ink">
                PDF
              </p>

              <p className="text-sm text-slateink">
                Document support
              </p>
            </div>

            <div>
              <p className="text-2xl font-semibold text-ink">
                AI
              </p>

              <p className="text-sm text-slateink">
                Context answers
              </p>
            </div>

          </div>

        </div>

        {/* Right - AI Preview */}

        <div className="relative">

          {/* Glow */}
          <div className="absolute -inset-6 bg-teal/10 rounded-[2rem] blur-3xl" />

          <div className="relative rounded-3xl border border-white/20 bg-[#162028] shadow-2xl overflow-hidden">

            {/* Window header */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">

              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber" />
                <span className="w-3 h-3 rounded-full bg-teal" />
              </div>

              <span className="text-xs text-slate-400">
                Marginal AI
              </span>

            </div>

            <div className="p-6 space-y-5">

              {/* Document */}

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">

                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  📄
                </div>

                <div>
                  <p className="text-sm text-white font-medium">
                    research-paper.pdf
                  </p>

                  <p className="text-xs text-slate-400">
                    Indexed and ready
                  </p>
                </div>

                <span className="ml-auto text-xs text-teal">
                  ✓ Ready
                </span>

              </div>

              {/* User message */}

              <div className="flex justify-end">

                <div className="max-w-[80%] bg-teal text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm shadow-lg">
                  What are the main findings?
                </div>

              </div>

              {/* AI message */}

              <div className="max-w-[92%] bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-5">

                <div className="flex items-center gap-2 mb-3">

                  <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-xs text-white">
                    M
                  </div>

                  <span className="text-xs text-slate-400">
                    Marginal AI
                  </span>

                </div>

                <p className="text-sm leading-relaxed text-slate-200">

                  The research found that retrieval-augmented models
                  significantly reduced factual errors compared to baseline
                  models.

                  <sup className="text-amber font-semibold ml-1">
                    [1]
                  </sup>

                </p>

                <div className="mt-4 pt-3 border-t border-white/10">

                  <div className="inline-flex items-center gap-2 bg-amber/10 text-amber px-3 py-1.5 rounded-lg text-xs">

                    <span>[1]</span>

                    research-paper.pdf · page 4

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </header>

      {/* Features */}

      <section className="max-w-7xl mx-auto px-6 py-24">

        <div className="max-w-2xl mb-16">

          <p className="text-teal font-semibold text-sm tracking-wide uppercase mb-3">
            Why Marginal
          </p>

          <h2 className="font-serif text-4xl md:text-5xl text-ink mb-5">

            AI answers you can actually verify.

          </h2>

          <p className="text-lg text-slateink leading-relaxed">

            Marginal combines semantic search with modern language models to
            answer questions using information retrieved directly from your
            documents.

          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {FEATURES.map((feature) => (

            <div
              key={feature.title}
              className="group bg-white/70 backdrop-blur border border-slate-200 rounded-2xl p-7 hover:border-teal/40 hover:shadow-xl hover:shadow-teal/5 hover:-translate-y-1 transition-all duration-300"
            >

              <div className="text-2xl mb-5">

                {feature.icon}

              </div>

              <h3 className="font-serif text-xl text-ink mb-3">

                {feature.title}

              </h3>

              <p className="text-slateink leading-relaxed text-sm">

                {feature.body}

              </p>

            </div>

          ))}

        </div>

      </section>

      {/* How it works */}

      <section className="border-y border-slate-200 bg-white/50 backdrop-blur">

        <div className="max-w-7xl mx-auto px-6 py-24">

          <div className="text-center max-w-2xl mx-auto mb-16">

            <p className="text-teal font-semibold text-sm uppercase tracking-wide mb-3">
              Simple workflow
            </p>

            <h2 className="font-serif text-4xl md:text-5xl text-ink">

              From document to answer in seconds.

            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {STEPS.map((step, index) => (

              <div
                key={step.title}
                className="relative bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >

                <div className="absolute -top-5 left-8 w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-semibold shadow-lg">

                  {index + 1}

                </div>

                <p className="text-xs tracking-widest text-teal font-semibold mb-5">

                  STEP {step.number}

                </p>

                <h3 className="font-serif text-2xl text-ink mb-3">

                  {step.title}

                </h3>

                <p className="text-sm text-slateink leading-relaxed">

                  {step.body}

                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="max-w-7xl mx-auto px-6 py-24">

        <div className="relative overflow-hidden rounded-3xl bg-[#162028] px-8 py-16 md:px-16 text-center">

          <div className="absolute inset-0 bg-gradient-to-br from-teal/20 via-transparent to-transparent" />

          <div className="relative max-w-2xl mx-auto">

            <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">

              Start asking better questions.

            </h2>

            <p className="text-slate-300 text-lg mb-9">

              Upload your documents and turn them into a searchable knowledge
              base.

            </p>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-teal text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-teal-dark hover:-translate-y-1 transition-all"
            >

              Create your account

              <span>→</span>

            </Link>

          </div>

        </div>

      </section>

      {/* Footer */}

      <footer className="border-t border-slate-200">

        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row gap-3 justify-between text-sm text-slateink">

          <span>
            © 2026 Marginal
          </span>

          <span>
            AI-powered document intelligence
          </span>

        </div>

      </footer>

    </div>
  );
}