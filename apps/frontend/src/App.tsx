import "./styles.css";

export function App() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
        <p className="text-sm font-semibold uppercase text-emerald-300">
          Motus
        </p>
        <h1 className="mt-4 text-4xl font-semibold md:text-6xl">
          Dashboard de acessibilidade preditiva
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-zinc-300">
          Base React ligada ao backend Node. O monitor da camara, o simulador de
          hardware e os logs em tempo real entram nos proximos blocos.
        </p>
      </section>
    </main>
  );
}
