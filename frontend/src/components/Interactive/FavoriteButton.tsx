import { useEffect, useState } from 'react';

type Favorite = {
  tmdb_id: number;
};

type Props = {
  movieId: string;
  movieTitle: string;
  posterPath?: string | null;
};

const API_URL = import.meta.env.PUBLIC_API_BASE_URL ?? '';

export function FavoriteButton({
  movieId,
  movieTitle,
  posterPath,
}: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/favorites`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await response.text());
        }

        return response.json() as Promise<Favorite[]>;
      })
      .then((favorites) => {
        setIsFavorite(
          favorites.some((favorite) => favorite.tmdb_id === Number(movieId)),
        );
      })
      .catch((reason: unknown) => {
        console.error('お気に入り取得エラー:', reason);
        setError('お気に入り情報を取得できませんでした');
      })
      .finally(() => setLoading(false));
  }, [movieId]);

  const toggleFavorite = async () => {
    if (saving) return;

    setSaving(true);
    setError('');

    try {
      const response = isFavorite
        ? await fetch(`${API_URL}/api/favorites/${movieId}`, {
            method: 'DELETE',
          })
        : await fetch(`${API_URL}/api/favorites`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              tmdb_id: Number(movieId),
              movie_title: movieTitle,
              poster_path: posterPath ?? null,
            }),
          });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message ?? 'お気に入りの更新に失敗しました');
      }

      setIsFavorite((current) => !current);
    } catch (reason) {
      console.error('お気に入り更新エラー:', reason);
      setError('お気に入りの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={loading || saving}
        aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
        aria-pressed={isFavorite}
        className={`rounded-full px-5 py-3 text-2xl transition hover:scale-110 disabled:opacity-50 ${
          isFavorite
            ? 'bg-red-600 text-white'
            : 'bg-slate-800 text-white hover:bg-red-600'
        }`}
      >
        {isFavorite ? '♥' : '♡'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}