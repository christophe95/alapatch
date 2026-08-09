export default function Card(props) {
  return (
    <div
      className={
        props.className +
        ' mb-2 mr-3 flex flex-col justify-start border border-gray-300 rounded-md shadow-md bg-white'
      }
    >
      <header className="flex items-start justify-between py-1 px-2 border-b border-solid border-gray-200">
        <h3 className="pointer-events-none text-xl font-semibold text-gray-900">
          {props.header}
        </h3>
      </header>
      <section className="flex-grow flex flex-col justify-evenly my-1 px-3">
        {props.children}
      </section>
    </div>
  );
}
