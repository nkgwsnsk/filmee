import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { supabase } from './lib/supabase';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:4321',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});

app.get('/api/health', async () => {
  return { ok: true };
});

app.get('/api/favorites', async (request, reply) => {
  const { data: favorites, error: favoriteError } = await supabase
    .from('favorites')
    .select('*')
    .order('created_at', { ascending: false });

  if (favoriteError) {
    request.log.error(favoriteError);
    return reply.code(500).send({ message: favoriteError.message });
  }

  const tmdbIds = favorites.map((favorite) => favorite.tmdb_id);

  const { data: reviews, error: reviewError } = tmdbIds.length
    ? await supabase
        .from('reviews')
        .select('tmdb_id')
        .in('tmdb_id', tmdbIds)
    : { data: [], error: null };

  if (reviewError) {
    request.log.error(reviewError);
    return reply.code(500).send({ message: reviewError.message });
  }

  const reviewedIds = new Set(
    reviews.map((review) => review.tmdb_id),
  );

  return favorites.map((favorite) => ({
    ...favorite,
    has_review: reviewedIds.has(favorite.tmdb_id),
  }));
});

app.post<{
  Body: {
    tmdb_id: number;
    movie_title: string;
    poster_path?: string | null;
  };
}>('/api/favorites', async (request, reply) => {
  const { tmdb_id, movie_title, poster_path = null } = request.body;

  if (!Number.isInteger(tmdb_id) || !movie_title?.trim()) {
    return reply.code(400).send({
      message: 'tmdb_idとmovie_titleは必須です',
    });
  }

  const { data, error } = await supabase
    .from('favorites')
    .upsert(
      {
        tmdb_id,
        movie_title: movie_title.trim(),
        poster_path,
      },
      {
        onConflict: 'tmdb_id',
        ignoreDuplicates: false,
      },
    )
    .select()
    .single();

  if (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: error.message,
      details: error.details,
    });
  }

  return reply.send(data);
});

app.delete<{
  Params: {
    tmdbId: string;
  };
}>('/api/favorites/:tmdbId', async (request, reply) => {
  const tmdbId = Number(request.params.tmdbId);

  if (!Number.isInteger(tmdbId)) {
    return reply.code(400).send({ message: '映画IDが不正です' });
  }

  const { data, error } = await supabase
    .from('favorites')
    .delete()
    .eq('tmdb_id', tmdbId)
    .select();

  if (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  if (data.length === 0) {
    return reply.code(404).send({
      message: '削除対象のお気に入りが見つかりません',
    });
  }

  return reply.send({
    message: '削除しました',
    deleted: data[0],
  });
});

type ReviewBody = {
  tmdb_id: number;
  movie_title?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  review_title: string;
  rating: number;
  comment: string;
  tags?: string[];
};

app.get<{
  Params: { tmdbId: string };
}>('/api/movies/:tmdbId/reviews', async (request, reply) => {
  const tmdbId = Number(request.params.tmdbId);

  const { data, error } = await supabase
    .from('reviews')
    .select('*, review_tags(tag_id, tags(id, name))')
    .eq('tmdb_id', tmdbId)
    .order('created_at', { ascending: false });

  if (error) {
    request.log.error(error);
    return reply.code(500).send({ message: error.message });
  }

  return data;
});

app.post<{
  Body: ReviewBody;
}>('/api/reviews', async (request, reply) => {
  const body = request.body;

  if (
    !Number.isInteger(body.tmdb_id) ||
    !body.review_title?.trim() ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5 ||
    !body.comment?.trim()
  ) {
    return reply.code(400).send({ message: 'レビュー内容が不正です' });
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      tmdb_id: body.tmdb_id,
      movie_title: body.movie_title ?? null,
      poster_path: body.poster_path ?? null,
      backdrop_path: body.backdrop_path ?? null,
      review_title: body.review_title.trim(),
      rating: body.rating,
      comment: body.comment.trim(),
    })
    .select()
    .single();

  if (error) {
    request.log.error(error);
    return reply.code(500).send({ message: error.message });
  }

  await saveReviewTags(data.id, body.tags ?? []);

  return reply.code(201).send(data);
});

app.put<{
  Params: { reviewId: string };
  Body: Pick<ReviewBody, 'review_title' | 'rating' | 'comment' | 'tags'>;
}>('/api/reviews/:reviewId', async (request, reply) => {
  const { reviewId } = request.params;
  const body = request.body;

  const { data, error } = await supabase
    .from('reviews')
    .update({
      review_title: body.review_title.trim(),
      rating: body.rating,
      comment: body.comment.trim(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    request.log.error(error);
    return reply.code(500).send({ message: error.message });
  }

  await supabase.from('review_tags').delete().eq('review_id', reviewId);
  await saveReviewTags(reviewId, body.tags ?? []);

  return data;
});

async function saveReviewTags(reviewId: string, tagNames: string[]) {
  for (const value of [...new Set(tagNames)]) {
    const name = value.trim();
    if (!name) continue;

    const { data: tag, error } = await supabase
      .from('tags')
      .upsert({ name }, { onConflict: 'name' })
      .select()
      .single();

    if (error || !tag) continue;

    await supabase.from('review_tags').upsert({
      review_id: reviewId,
      tag_id: tag.id,
    });
  }
}

const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({
    port,
    host: '0.0.0.0',
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}