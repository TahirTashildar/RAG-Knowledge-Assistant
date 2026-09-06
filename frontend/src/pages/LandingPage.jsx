import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Grounded answers',
    body: 'Every answer is built from chunks retrieved out of your own uploaded files — not general knowledge dressed up as yours.',
  },
  {
    title: 'Visible sources',
    body: 'Each answer carries footnote-style markers pointing to the exact document and page a claim came from, so you can check it yourself.',
  },
  {
    title: 'Multi-query retrieval',
    body: 'Switch on alternative phrasings of your question to widen the search when the first pass misses relevant passages.',
  },
  {
    title: 'Real conversations',
    body: 'Ask a follow-up like "what about its limitations?" and the assistant keeps enough recent context to understand what "its" means.',
  },
];

const STEPS = [
  { title: 'Upload', body: 'Add a PDF, TXT, or DOCX file. It gets split into chunks and embedded for search.' },
  { title: 'Ask', body: 'Ask a question in plain language — no special syntax needed.' },
  { title: 'Read', body: 'Get an answer with numbered source markers you can open to see the original passage.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-body">
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-serif text-xl font-semibold text-ink">Marginal</span>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/login" className="text-slateink hover:text-ink">
            Log in
          </Link>
          <Link to="/register" className="bg-teal text-white px-4 py-2 rounded hover:bg-teal-dark transition-colors">
            Register
          </Link>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-6 pt-12 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-serif text-5xl leading-tight text-ink mb-6">
            Ask your documents anything. Get answers with the receipts.
          </h1>
          <p className="text-lg text-slateink mb-8 max-w-md">
            Marginal reads what you upload, answers from it, and shows exactly
            which page each claim came from — so you never have to take an
            AI's word for it.
          </p>
          <div className="flex gap-4">
            <Link to="/register" className="bg-teal text-white px-6 py-3 rounded font-medium hover:bg-teal-dark transition-colors">
              Register
            </Link>
            <Link to="/login" className="border border-slateink/30 px-6 py-3 rounded font-medium hover:border-ink transition-colors">
              Log in
            </Link>
          </div>
        </div>

        <div className="bg-ink rounded-lg p-6 text-paper font-sans text-sm shadow-xl">
          <p className="text-slateink mb-3">research-paper.pdf uploaded</p>
          <div className="bg-white/5 rounded p-4 mb-3">
            <p className="text-paper/90">What are the main findings?</p>
          </div>
          <div className="bg-teal/20 border border-teal/40 rounded p-4">
            <p className="text-paper/95 leading-relaxed">
              The study found that retrieval-augmented models reduced factual
              errors by a wide margin compared to the baseline
              <sup className="text-amber font-semibold"> [1]</sup>, and that
              answer quality depended heavily on chunk size
              <sup className="text-amber font-semibold"> [2]</sup>.
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slateink space-y-1">
              <p>
                <span className="text-amber font-semibold">[1]</span> research-paper.pdf · page 4
              </p>
              <p>
                <span className="text-amber font-semibold">[2]</span> research-paper.pdf · page 7
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slateink/10">
        <h2 className="font-serif text-2xl text-ink mb-2">What retrieval-augmented generation actually does</h2>
        <p className="text-slateink max-w-2xl mb-10">
          A plain language model can only answer from what it was trained on.
          RAG changes that: your question is matched against chunks of your
          own documents by meaning (not just keywords), and only those
          matching chunks are handed to the model as context. The answer is
          built from what's actually in your files.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-l-2 border-teal pl-5">
              <h3 className="font-serif text-lg text-ink mb-1">{f.title}</h3>
              <p className="text-slateink text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slateink/10">
        <h2 className="font-serif text-2xl text-ink mb-10">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.title}>
              <p className="text-amber font-serif text-3xl mb-2">{i + 1}</p>
              <h3 className="font-medium text-ink mb-1">{s.title}</h3>
              <p className="text-slateink text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-slateink/10 text-sm text-slateink">
        Marginal — a portfolio RAG project.
      </footer>
    </div>
  );
}
