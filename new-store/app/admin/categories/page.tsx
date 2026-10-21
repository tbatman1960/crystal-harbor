import { categories } from '@/lib/data';
import { CategoryManager } from '@/components/category-manager';
export default async function Categories() {
  return (
    <>
      <h1 className="text-4xl">Categories</h1>
      <CategoryManager categories={await categories()} />
    </>
  );
}
