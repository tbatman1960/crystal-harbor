import {catalogClient} from '@/lib/catalog-access';
import { categories } from '@/lib/data';
import { ProductForm } from '@/components/product-form';
export default async function NewProduct() {
  return (
    <>
      <h1 className="text-4xl">Add a product</h1>
      <ProductForm managementPath="/catalog" categories={await categories()} />
    </>
  );
}
