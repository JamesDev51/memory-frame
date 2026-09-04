const plannedFeatures = [
  'Grid / Heart layout',
  'Frame presets',
  'Gap presets',
  'Shadow on / off',
  'High-resolution PNG',
  'Print-ready PDF',
]

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">MEMORY FRAME</span>
        <h1>사진만 고르면,<br />예쁜 한 장이 완성돼요.</h1>
        <p className="description">
          서버에 사진을 올리지 않고 브라우저 안에서만 편집하는 무료 포토 프레임 메이커입니다.
        </p>

        <div className="status-card" aria-label="project status">
          <div>
            <span className="status-dot" />
            <strong>Project scaffold ready</strong>
          </div>
          <span className="status-copy">V1 editor coming next</span>
        </div>

        <div className="feature-list">
          {plannedFeatures.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
      </section>
    </main>
  )
}
