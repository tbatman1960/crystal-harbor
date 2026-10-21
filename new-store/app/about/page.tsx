export const metadata = { title: 'Our story' };
export default function About() {
  return (
    <article className="shell max-w-3xl py-16">
      <p className="eyebrow mb-5 text-clay">A slower kind of shopping</p>
      <h1>Objects with a little more meaning.</h1>
      <p className="mt-8 text-lg">
        SnuggleBug is a small, independently run shop for jewelry, natural
        crystals, beaded accessories, and little things that make a home feel
        like yours.
      </p>
      <p className="mt-6">
        We choose our collection with care and pack each order by hand. We
        believe a beautiful object doesn’t need to be complicated. Sometimes
        it’s a favorite bracelet, a stone on your desk, or a small gift that
        says “I thought of you.”
      </p>
      <p className="mt-6">
        Natural stones vary in color, shape, and markings. Those differences are
        part of their character. Please review each listing’s description before
        ordering.
      </p>
    </article>
  );
}
