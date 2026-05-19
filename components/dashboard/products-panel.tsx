type Product = {
  code: string;
  name: string;
  range: string;
  repayment: string;
};

type ProductsPanelProps = {
  companyShortName: string;
  products: Product[];
};

export function ProductsPanel({ companyShortName, products }: ProductsPanelProps) {
  return (
    <section className="panel" id="loans">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Products</p>
          <h3>Available for {companyShortName}</h3>
        </div>
      </div>
      <div className="productStack">
        {products.map((product) => (
          <article className="productItem" key={product.code}>
            <div>
              <strong>{product.code}</strong>
              <h4>{product.name}</h4>
              <p>{product.repayment}</p>
            </div>
            <span>{product.range}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
