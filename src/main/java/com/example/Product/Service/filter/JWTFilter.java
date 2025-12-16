package com.example.Product.Service.filter;

import com.example.Product.Service.repository.ManagerRepo;
import com.example.Product.Service.repository.UserRepo;
import com.example.Product.Service.util.JWTUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

//@Component
public class JWTFilter extends OncePerRequestFilter {
    private final JWTUtil jWTUtil;
    private final UserRepo userRepo;
    private final ManagerRepo managerRepo;

    public JWTFilter(JWTUtil jWTUtil, UserRepo userRepo, ManagerRepo managerRepo) {
        this.jWTUtil = jWTUtil;
        this.userRepo = userRepo;
        this.managerRepo = managerRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        String token = null;
        String username = null;
        if(header != null && header.startsWith("Bearer ")){
            token = header.substring(7);
        }
        if(token!=null && SecurityContextHolder.getContext().getAuthentication() == null){
            username = jWTUtil.extractUsername(token);
            UsernamePasswordAuthenticationToken auth;
            if(!jWTUtil.isExpired(token,username)){
                if(username.equals("admin")) {
                    UserDetails userDetails = userRepo.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException("User Not Found!!"));
                    auth = new UsernamePasswordAuthenticationToken(userDetails
                            ,null,userDetails.getAuthorities());
                }
                else{
                    UserDetails userDetails = managerRepo.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException("User Not Found!!"));
                    auth = new UsernamePasswordAuthenticationToken(userDetails
                            ,null,userDetails.getAuthorities());
                }

                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request,response);
    }
}
