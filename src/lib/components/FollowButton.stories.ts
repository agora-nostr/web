import type { Meta, StoryObj } from '@storybook/svelte';
import FollowButton from './FollowButton.svelte';

const meta = {
  title: 'Components/FollowButton',
  component: FollowButton as any,
  tags: ['autodocs'],
  args: {
    pubkey: 'fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52',
    variant: 'default',
    showIcon: true,
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultNotFollowing: Story = {
  args: {
    pubkey: 'fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52',
    variant: 'default',
  },
};

export const DefaultFollowing: Story = {
  args: {
    pubkey: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
    variant: 'default',
  },
};

export const PrimaryNotFollowing: Story = {
  args: {
    pubkey: '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
    variant: 'primary',
  },
};

export const PrimaryFollowing: Story = {
  args: {
    pubkey: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
    variant: 'primary',
  },
};

export const WithoutIcon: Story = {
  args: {
    pubkey: 'e88a691e98d9987c964521dff60025f60700378a4879180dcbbb4a5027850411',
    variant: 'primary',
    showIcon: false,
  },
};

export const CustomStyling: Story = {
  args: {
    pubkey: '7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194',
    class: 'bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600',
  },
};
