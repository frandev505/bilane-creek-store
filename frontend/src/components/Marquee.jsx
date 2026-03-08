export default function Marquee({ text }) {
  return (
    <div className="bg-black text-white overflow-hidden py-3 whitespace-nowrap">
      <div className="inline-block text-sm font-bold tracking-widest uppercase">
        {Array(20).fill(text).map((item, index) => (
          <span key={index} className="mx-4">{item}</span>
        ))}
      </div>
    </div>
  );
}