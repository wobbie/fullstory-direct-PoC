import { Link } from 'react-router-dom';

export function Home() {
  return (
    <section>
      <h1>Leaf &amp; Bean</h1>
      <p>
        A small demo storefront for exploring <strong>FullStory</strong> loaded directly by the app (no Google Tag
        Manager). Open the <em>Analytics debug</em> panel (bottom left) to watch the FullStory calls as you click
        around.
      </p>
      <h2>Things to try</h2>
      <ol className="steps">
        <li>Accept or reject analytics in the consent banner. FullStory only loads after you accept.</li>
        <li><Link to="/products">Add products to your cart</Link>. Each one sends a <code>Product Added</code> event.</li>
        <li><Link to="/login">Log in</Link> as any username. FullStory identifies the session with a non-PII user ID.</li>
        <li><Link to="/checkout">Check out</Link>. The card field is excluded from capture and the email is masked.</li>
        <li>Visit the <Link to="/signals">Signals lab</Link> to generate rage clicks, dead clicks and error clicks.</li>
        <li>Open the replay link in the debug panel to watch your own session in FullStory.</li>
      </ol>
    </section>
  );
}
