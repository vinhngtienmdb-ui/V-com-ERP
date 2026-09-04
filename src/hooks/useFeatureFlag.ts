/**
 * ============================================================================
 *  useFeatureFlag.ts — GĐ 3.2: Hook đọc feature flag
 * ============================================================================
 *
 *  Dùng thay cho các hằng số bật/tắt hardcode trong component.
 *
 *  ```tsx
 *  const tt99 = useFeatureFlag(FEATURE_FLAGS.TT99_BRIDGE);
 *  if (!tt99) return <Banner>Chức năng chưa bật</Banner>;
 *  ```
 *
 *  ⭐ Hành vi trong lúc đang tải: **false (fail-closed)**.
 *    Nhờ vậy component KHÔNG BAO GIỜ render một tính năng chưa được phép bật,
 *    kể cả trong khoảnh khắc flag chưa đọc xong. Ngược lại (mặc định true) sẽ
 *    gây tình trạng "chớp": hiện tính năng lên rồi lại tắt đi.
 *
 *    Hệ quả cần nhớ: `loading` tách riêng để những chỗ cần phân biệt
 *    "đang tải" với "thật sự tắt" dùng hook `useFeatureFlagDetailed`.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import {
  isFeatureEnabled,
  areFeaturesEnabled,
  FEATURE_FLAGS,
  type FeatureFlagKey,
  type IsEnabledOptions,
} from '../services/featureFlagService';

export { FEATURE_FLAGS };
export type { FeatureFlagKey };

/** Trả boolean. Đang tải hoặc lỗi → false (fail-closed). */
export function useFeatureFlag(
  key: FeatureFlagKey | string,
  opts: IsEnabledOptions = {}
): boolean {
  return useFeatureFlagDetailed(key, opts).enabled;
}

export interface FeatureFlagState {
  enabled: boolean;
  /** Đang đọc flag lần đầu. `enabled` lúc này luôn là false. */
  loading: boolean;
  /** Khác null khi không đọc được flag (chưa chạy migration / mất mạng). */
  error: string | null;
}

/**
 * Bản chi tiết: tách được "đang tải" và "thật sự tắt".
 * Dùng khi cần hiển thị skeleton, hoặc cần cảnh báo "không đọc được cấu hình".
 */
export function useFeatureFlagDetailed(
  key: FeatureFlagKey | string,
  opts: IsEnabledOptions = {}
): FeatureFlagState {
  const [state, setState] = useState<FeatureFlagState>({ enabled: false, loading: true, error: null });

  const tenantId = opts.tenantId ?? null;
  const subject = opts.subject ?? null;
  const fallback = opts.fallback ?? false;

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    isFeatureEnabled(key, { tenantId, subject, fallback })
      .then((enabled) => {
        if (!cancelled) setState({ enabled, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            enabled: fallback,
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, tenantId, subject, fallback]);

  return state;
}

/** Đọc nhiều flag cùng lúc (1 trang dùng 3–4 flag → 1 hook thay vì 4). */
export function useFeatureFlags(
  keys: ReadonlyArray<FeatureFlagKey | string>,
  opts: IsEnabledOptions = {}
): Record<string, boolean> {
  const [map, setMap] = useState<Record<string, boolean>>({});

  const tenantId = opts.tenantId ?? null;
  const subject = opts.subject ?? null;
  const fallback = opts.fallback ?? false;
  const joined = keys.join('|');

  useEffect(() => {
    let cancelled = false;
    const list = joined ? joined.split('|') : [];

    areFeaturesEnabled(list, { tenantId, subject, fallback })
      .then((res) => {
        if (!cancelled) setMap(res);
      })
      .catch(() => {
        if (!cancelled) setMap(Object.fromEntries(list.map((k) => [k, fallback])));
      });

    return () => {
      cancelled = true;
    };
  }, [joined, tenantId, subject, fallback]);

  return map;
}
