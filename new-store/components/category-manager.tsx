'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';
import { api, Notice, Submit } from './ui';
import { DeleteButton } from './admin-actions';
const blank = {
  name: '',
  slug: '',
  parent_id: null as string | null,
  sort_order: 0,
};
export function CategoryManager({ categories }: { categories: Category[] }) {
  const [value, setValue] = useState<typeof blank & { id?: string }>(blank);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      <section className="space-y-3">
        {categories.map((c) => (
          <div
            className="panel flex flex-wrap justify-between gap-4"
            key={c.id}
          >
            <div>
              <h2 className="text-xl">
                {c.parent_id ? '↳ ' : ''}
                {c.name}
              </h2>
              <p className="text-xs">
                /{c.slug} · position {c.sort_order}
              </p>
            </div>
            <button className="link" onClick={() => setValue(c)}>
              Edit
            </button>
            <DeleteButton table="categories" id={c.id} />
          </div>
        ))}
      </section>
      <form
        className="panel space-y-5 self-start"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError('');
          try {
            await api('/api/admin', { kind: 'category', value });
            setValue(blank);
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setPending(false);
          }
        }}
      >
        <h2 className="text-2xl">
          {value.id ? 'Edit category' : 'Add a category'}
        </h2>
        <label>
          Name
          <input
            required
            value={value.name}
            onChange={(e) =>
              setValue({
                ...value,
                name: e.target.value,
                ...(!value.id
                  ? {
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    }
                  : {}),
              })
            }
          />
        </label>
        <label>
          Slug
          <input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={value.slug}
            onChange={(e) => setValue({ ...value, slug: e.target.value })}
          />
        </label>
        <label>
          Parent category
          <select
            value={value.parent_id || ''}
            onChange={(e) =>
              setValue({ ...value, parent_id: e.target.value || null })
            }
          >
            <option value="">Top level</option>
            {categories
              .filter((c) => !c.parent_id && c.id !== value.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Sort order (lowest first)
          <input
            type="number"
            min={0}
            max={10000}
            value={value.sort_order}
            onChange={(e) =>
              setValue({ ...value, sort_order: Number(e.target.value) })
            }
          />
        </label>
        <Notice error={error} />
        <Submit pending={pending}>Save category</Submit>
        {value.id && (
          <button
            className="link ml-4"
            type="button"
            onClick={() => setValue(blank)}
          >
            Cancel edit
          </button>
        )}
      </form>
    </div>
  );
}
