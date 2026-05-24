import echo from '../echo';

export function registerTestListener() {
  const channel = echo.channel('test-channel');
  
  channel.listen('TestMessage', (data: any) => {
    console.log('✅ Received TestMessage:', data);
    alert(`Received TestMessage: ${data.message}`);
  });
  
  return channel;
}
