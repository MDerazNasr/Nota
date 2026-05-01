import type { Item as ItemModel } from "../lib/types";

type ItemProps = {
  item: ItemModel;
};

export function Item({ item }: ItemProps) {
  return (
    <article className="item-row" data-state={item.state}>
      <span className="item-check" aria-hidden="true" />
      <div className="item-content" />
    </article>
  );
}
