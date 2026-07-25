export function StartScreen({ onStart }: { onStart: () => void; onDashboard: () => void }) {
  return (
    <main className="start-screen">
      <h1 className="sr-only">คุณคือใครใน SDGs 5P</h1>
      <img
        className="start-logo"
        src="/assets/splash-screen.png"
        alt=""
        aria-hidden="true"
      />
      <img
        className="start-intro"
        src="/assets/intro-image.png"
        alt=""
        aria-hidden="true"
      />
      <button className="start-button" onClick={onStart}>
        <img src="/assets/sdgs-wheel.svg" alt="" aria-hidden="true" />
        <span>เริ่ม</span>
      </button>
    </main>
  )
}
