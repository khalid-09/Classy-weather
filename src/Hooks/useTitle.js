import { useEffect } from 'react';

export function useTitle(location) {
  useEffect(
    function () {
      if (!location) return;
      document.title = `${location.split(' ').at(0)}'s Weather`;
      return () => (document.title = `Classy Weather`);
    },
    [location]
  );
}
