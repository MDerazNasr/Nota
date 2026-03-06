import type { Item as ItemModel } from "../lib/types";
import { extractText } from "../lib/content";

type ItemProps = {
  item: ItemModel;
  focused: boolean;
};

export function Item({ focused, item }: ItemProps) {
  const text = extractText(item.content);

  return (
    <article className={focused ? "item-row focused" : "item-row"} data-state={item.state}>
      <span className="item-check" aria-hidden="true" />
      <div className="item-content">{text || "New item"}</div>
    </article>
  );
}
