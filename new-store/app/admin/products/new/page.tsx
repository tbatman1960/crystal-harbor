import { categories } from '@/lib/data';
import { ProductForm } from '@/components/product-form';
export default async function NewProduct() {
  return (
    <>
      <h1 className="text-4xl">A new treasure</h1>
      <ProductForm categories={await categories()} />
    </>
  );
}
