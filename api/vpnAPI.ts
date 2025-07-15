import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Connection states
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

// Mock connection for web platform
const mockConnection = {
  state: 'disconnected' as ConnectionState,
  server: null as any,
  startTime: 0,
  ip: '',
  timer: null as NodeJS.Timeout | null,
};

// Connection state listeners
const listeners: Array<(state: ConnectionState) => void> = [];

// Add a listener for connection state changes
export const addConnectionListener = (callback: (state: ConnectionState) => void) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

// Notify all listeners of connection state change
const notifyListeners = (state: ConnectionState) => {
  listeners.forEach(listener => listener(state));
};

// Get a random IP address for simulation
const getRandomIP = (country: string) => {
  const firstOctet = country === 'United States' ? '35' : 
                     country === 'United Kingdom' ? '51' : 
                     country === 'Germany' ? '77' : 
                     country === 'Japan' ? '126' : 
                     country === 'Australia' ? '43' : '192';
  
  return `${firstOctet}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

// Save connection state to storage
const saveConnectionState = async (state: typeof mockConnection) => {
  try {
    await AsyncStorage.setItem('vpn_connection_state', JSON.stringify({
      state: state.state,
      server: state.server,
      startTime: state.startTime,
      ip: state.ip,
    }));
  } catch (error) {
    console.error('Error saving connection state:', error);
  }
};

// Load connection state from storage
export const loadConnectionState = async () => {
  try {
    const stateJson = await AsyncStorage.getItem('vpn_connection_state');
    if (stateJson) {
      const savedState = JSON.parse(stateJson);
      
      // Only restore if the state was connected
      if (savedState.state === 'connected') {
        mockConnection.state = savedState.state;
        mockConnection.server = savedState.server;
        mockConnection.startTime = savedState.startTime;
        mockConnection.ip = savedState.ip;
        notifyListeners(mockConnection.state);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error loading connection state:', error);
    return false;
  }
};

// Get current connection status
export const getConnectionStatus = () => {
  return {
    state: mockConnection.state,
    server: mockConnection.server,
    startTime: mockConnection.startTime,
    ip: mockConnection.ip,
    elapsedTime: mockConnection.startTime ? Math.floor((Date.now() - mockConnection.startTime) / 1000) : 0
  };
};

/**
 * Connect to a VPN server
 * @param accessKey Outline VPN access key
 * @returns Object with connection result
 */
export const connectVPN = async (accessKey: string) => {
  try {
    // Update state to connecting
    mockConnection.state = 'connecting';
    notifyListeners(mockConnection.state);
    
    // Simulate connecting delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (Platform.OS === 'web') {
      // For web, we just simulate a connection
      console.log('Web platform detected, simulating VPN connection');
      
      // Get the server from storage (assuming it was set before calling this function)
      const serverJson = await AsyncStorage.getItem('vpn_selected_server');
      if (!serverJson) {
        throw new Error('No server selected');
      }
      
      const server = JSON.parse(serverJson);
      
      // Simulate successful connection
      mockConnection.state = 'connected';
      mockConnection.server = server;
      mockConnection.startTime = Date.now();
      mockConnection.ip = getRandomIP(server.country);
      
      // Save connection state
      await saveConnectionState(mockConnection);
      
      // Notify listeners
      notifyListeners(mockConnection.state);
      
      return {
        success: true,
        message: 'Connected successfully',
        ip: mockConnection.ip
      };
    } else {
      // For mobile platforms, this would integrate with native modules
      // This is a placeholder for actual implementation
      console.log('Mobile platform detected, would connect to real VPN here');
      
      /*
       * IMPLEMENTATION NOTES FOR ANDROID:
       * 
       * 1. Create a native module that interfaces with Android VpnService
       * 2. Parse the Outline access key to extract server information
       * 3. Use the TunnelService from the Outline SDK or implement your own
       * 
       * Example pseudo-code for native implementation:
       * 
       * import VpnModule from './NativeModules/VpnModule';
       * const result = await VpnModule.connect(accessKey);
       */
      
      /*
       * IMPLEMENTATION NOTES FOR IOS:
       * 
       * 1. Use NetworkExtension framework via a native module
       * 2. Set up an NEPacketTunnelProvider for handling the VPN connection
       * 3. Configure with the Outline connection details
       */
      
      // For now, simulate successful connection for demo
      const serverJson = await AsyncStorage.getItem('vpn_selected_server');
      if (!serverJson) {
        throw new Error('No server selected');
      }
      
      const server = JSON.parse(serverJson);
      
      mockConnection.state = 'connected';
      mockConnection.server = server;
      mockConnection.startTime = Date.now();
      mockConnection.ip = getRandomIP(server.country);
      
      await saveConnectionState(mockConnection);
      notifyListeners(mockConnection.state);
      
      return {
        success: true,
        message: 'Connected successfully',
        ip: mockConnection.ip
      };
    }
  } catch (error: any) {
    console.error('VPN connection error:', error);
    
    mockConnection.state = 'error';
    notifyListeners(mockConnection.state);
    
    return {
      success: false,
      message: error.message || 'Failed to connect to VPN',
      error
    };
  }
};

/**
 * Disconnect from the VPN server
 * @returns Object with disconnection result
 */
export const disconnectVPN = async () => {
  try {
    // Only proceed if we're connected or in error state
    if (mockConnection.state !== 'connected' && mockConnection.state !== 'error') {
      return {
        success: false,
        message: 'Not connected to VPN'
      };
    }
    
    // Update state to disconnecting
    mockConnection.state = 'disconnecting';
    notifyListeners(mockConnection.state);
    
    // Simulate disconnecting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (Platform.OS === 'web') {
      // For web, we just simulate disconnection
      console.log('Web platform detected, simulating VPN disconnection');
      
      // Reset connection state
      mockConnection.state = 'disconnected';
      mockConnection.server = null;
      mockConnection.startTime = 0;
      mockConnection.ip = '';
      
      // Clear connection state from storage
      await AsyncStorage.removeItem('vpn_connection_state');
      
      // Notify listeners
      notifyListeners(mockConnection.state);
      
      return {
        success: true,
        message: 'Disconnected successfully'
      };
    } else {
      // For mobile platforms, this would integrate with native modules
      // This is a placeholder for actual implementation
      console.log('Mobile platform detected, would disconnect from real VPN here');
      
      /*
       * IMPLEMENTATION NOTES:
       * 
       * Similar to connect, but calling the disconnect method:
       * await VpnModule.disconnect();
       */
      
      // Reset connection state
      mockConnection.state = 'disconnected';
      mockConnection.server = null;
      mockConnection.startTime = 0;
      mockConnection.ip = '';
      
      await AsyncStorage.removeItem('vpn_connection_state');
      notifyListeners(mockConnection.state);
      
      return {
        success: true,
        message: 'Disconnected successfully'
      };
    }
  } catch (error: any) {
    console.error('VPN disconnection error:', error);
    
    // Even on error, we set the state to disconnected
    mockConnection.state = 'disconnected';
    mockConnection.server = null;
    mockConnection.startTime = 0;
    mockConnection.ip = '';
    
    await AsyncStorage.removeItem('vpn_connection_state');
    notifyListeners(mockConnection.state);
    
    return {
      success: false,
      message: error.message || 'Error during disconnection',
      error
    };
  }
};

// Check connection status periodically (for UI updates)
export const startConnectionMonitoring = () => {
  if (mockConnection.timer) {
    clearInterval(mockConnection.timer);
  }
  
  // Check every 5 seconds
  mockConnection.timer = setInterval(() => {
    if (mockConnection.state === 'connected') {
      // In a real implementation, this would check if the VPN connection is still active
      console.log('Monitoring VPN connection...');
    }
  }, 5000);
  
  return () => {
    if (mockConnection.timer) {
      clearInterval(mockConnection.timer);
      mockConnection.timer = null;
    }
  };
};

// Stop connection monitoring
export const stopConnectionMonitoring = () => {
  if (mockConnection.timer) {
    clearInterval(mockConnection.timer);
    mockConnection.timer = null;
  }
};

// Check if connected to VPN
export const isConnectedToVPN = () => {
  return mockConnection.state === 'connected';
};