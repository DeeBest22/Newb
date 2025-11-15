import { PageDto } from './dto/page.dto';

export const paginationFormat = ({
  data,
  total_items,
  limit,
  page,
  route,
}): PageDto => {
  const total_pages =
    total_items !== undefined ? Math.ceil(total_items / limit) : undefined;
  // const hasFirstPage = route;
  const has_previous_page = route && page > 1;
  const has_next_page =
    route &&
    total_items !== undefined &&
    total_pages !== undefined &&
    page < total_pages;

  const meta = {
    total_items,
    item_count: data.length,
    items_perpage: parseInt(limit),
    total_pages: total_pages ?? 0,
    current_page: parseInt(page),
    has_next_page,
    has_previous_page,
  };
  return {
    success: true,
    data,
    meta,
  };
};
