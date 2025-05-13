"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming shadcn/ui is set up

interface User {
  id: string;
  name: string;
}

interface UserSelectorProps {
  users: User[];
  selectedUserId: string | 'all'; // 'all' can be a special value
}

export function UserSelector({ users, selectedUserId }: UserSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUserChange = (newUserId: string) => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

    if (newUserId === 'all') {
      currentParams.delete('userId');
    } else {
      currentParams.set('userId', newUserId);
    }
    const query = currentParams.toString();
    // Navigate to the new URL, this will re-render the Server Component (page.tsx)
    // which will then re-fetch data based on the new userId.
    router.push(`/team${query ? `?${query}` : ''}`);
  };

  return (
    <div className="mb-4">
      <label htmlFor="user-select-trigger" className="block text-sm font-medium text-gray-700 mb-1">
        Select User
      </label>
      <Select value={selectedUserId} onValueChange={handleUserChange}>
        <SelectTrigger id="user-select-trigger" className="w-[240px] bg-white"> {/* Shadcn typically handles its own styling, added bg-white for clarity */}
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 