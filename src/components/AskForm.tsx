export function AskForm({
  initial = "",
  inputId = "ask-q",
}: {
  initial?: string;
  inputId?: string;
}) {
  return (
    <form action="/ask" method="get" className="ask-form" role="search">
      <label htmlFor={inputId}>Ask a question</label>
      <div className="ask-row">
        <input
          id={inputId}
          name="q"
          defaultValue={initial}
          placeholder="A game, a player, or a year"
          autoComplete="off"
        />
        <button type="submit">Ask</button>
      </div>
    </form>
  );
}
