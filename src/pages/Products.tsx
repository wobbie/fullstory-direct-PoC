import { Link, useParams } from 'react-router-dom';
import { PRODUCTS, useAppState } from '../state/AppState';

export function Products() {
  const { addToCart } = useAppState();
  return (
    <section>
      <h1>Products</h1>
      <div className="grid">
        {PRODUCTS.map((p) => (
          <article key={p.sku} className="card">
            <h3><Link to={`/products/${p.sku}`}>{p.name}</Link></h3>
            <p className="muted">{p.category}</p>
            <p className="price">£{p.price.toFixed(2)}</p>
            {/* data-* attributes are captured by FullStory and make clicks easy to search and define as events. */}
            <button data-testid="add-to-cart" data-sku={p.sku} onClick={() => addToCart(p)}>
              Add to cart
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProductDetail() {
  const { sku } = useParams();
  const { addToCart } = useAppState();
  const product = PRODUCTS.find((p) => p.sku === sku);
  if (!product) return <p>Product not found. <Link to="/products">Back to products</Link></p>;
  return (
    <section>
      <p><Link to="/products">← All products</Link></p>
      <h1>{product.name}</h1>
      <p className="price">£{product.price.toFixed(2)}</p>
      <p>
        The route is <code>/products/{product.sku}</code> but the FullStory page name is the generic
        <code> Product Detail</code>. That keeps page names low-cardinality.
      </p>
      <button data-sku={product.sku} onClick={() => addToCart(product)}>Add to cart</button>
    </section>
  );
}
