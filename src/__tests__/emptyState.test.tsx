import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../components/ui/EmptyState';

describe('EmptyState component', () => {
  it('Render title cơ bản', () => {
    render(<EmptyState title="Chưa có đơn hàng" />);
    expect(screen.getByText('Chưa có đơn hàng')).toBeInTheDocument();
  });

  it('Render description khi có', () => {
    render(<EmptyState title="Chưa có data" description="Sẽ hiển thị tại đây" />);
    expect(screen.getByText('Sẽ hiển thị tại đây')).toBeInTheDocument();
  });

  it('Render action button khi có', () => {
    render(<EmptyState title="Empty" action={{ label: 'Add new', onClick: () => {} }} />);
    expect(screen.getByText('Add new')).toBeInTheDocument();
  });

  it('Variant compact — không hiện circle icon container', () => {
    const { container } = render(<EmptyState title="Compact" variant="compact" />);
    // Compact variant không có w-14 circle
    expect(container.querySelector('.w-14')).toBeNull();
  });

  it('Variant card — có border', () => {
    const { container } = render(<EmptyState title="Card" variant="card" />);
    expect(container.querySelector('.border-slate-300')).not.toBeNull();
  });
});
