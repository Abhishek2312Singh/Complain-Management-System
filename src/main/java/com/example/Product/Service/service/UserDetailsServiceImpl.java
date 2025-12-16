package com.example.Product.Service.service;

import com.example.Product.Service.repository.ManagerRepo;
import com.example.Product.Service.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    private ManagerRepo managerRepo;
    @Autowired
    private UserRepo userRepo;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username.equals("admin")) {
            return userRepo.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException("Admin Not Found!!"));
        }
        else {
            return managerRepo.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException("Manager Not Found!!"));
        }
    }
}
