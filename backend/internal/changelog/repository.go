package changelog

import "context"

type Repository interface {
	List(ctx context.Context, query ListChangelogQuery) ([]Entry, int64, error)
}
